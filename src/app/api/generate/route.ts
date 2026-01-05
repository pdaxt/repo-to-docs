import { NextRequest, NextResponse } from 'next/server';

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
}

interface RepoInfo {
  name: string;
  description: string;
  language: string;
  stars: number;
  files: string[];
}

// Parse GitHub URL to extract owner and repo
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)/,
    /github\.com:([^\/]+)\/([^\/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      };
    }
  }
  return null;
}

// Fetch repo metadata from GitHub API
async function fetchRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      ...(process.env.GITHUB_TOKEN && {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      }),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch repo: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    name: data.name,
    description: data.description || '',
    language: data.language || 'Unknown',
    stars: data.stargazers_count,
    files: [],
  };
}

// Fetch repo file tree (top-level + key directories)
async function fetchFileTree(owner: string, repo: string): Promise<string[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents`,
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        }),
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const files: GitHubFile[] = await response.json();
  const filePaths: string[] = [];

  for (const file of files) {
    if (file.type === 'file') {
      filePaths.push(file.path);
    } else if (file.type === 'dir' && ['src', 'lib', 'app', 'components', 'pages'].includes(file.name)) {
      // Fetch one level deep for key directories
      const subResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            ...(process.env.GITHUB_TOKEN && {
              Authorization: `token ${process.env.GITHUB_TOKEN}`,
            }),
          },
        }
      );
      if (subResponse.ok) {
        const subFiles: GitHubFile[] = await subResponse.json();
        for (const subFile of subFiles.slice(0, 10)) {
          filePaths.push(subFile.path);
        }
      }
    }
  }

  return filePaths.slice(0, 50); // Limit to 50 files
}

// Fetch content of key files
async function fetchKeyFiles(
  owner: string,
  repo: string
): Promise<{ path: string; content: string }[]> {
  const keyFiles = [
    'README.md',
    'readme.md',
    'package.json',
    'pyproject.toml',
    'Cargo.toml',
    'go.mod',
    'requirements.txt',
    'setup.py',
  ];

  const contents: { path: string; content: string }[] = [];

  for (const file of keyFiles) {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/main/${file}`
      );
      if (response.ok) {
        const content = await response.text();
        contents.push({ path: file, content: content.slice(0, 5000) });
      } else {
        // Try master branch
        const masterResponse = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/master/${file}`
        );
        if (masterResponse.ok) {
          const content = await masterResponse.text();
          contents.push({ path: file, content: content.slice(0, 5000) });
        }
      }
    } catch {
      // Skip files that can't be fetched
    }
  }

  // Also try to fetch main source files
  const sourcePatterns = ['src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.py', 'main.go', 'lib/index.ts'];
  for (const file of sourcePatterns) {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/main/${file}`
      );
      if (response.ok) {
        const content = await response.text();
        contents.push({ path: file, content: content.slice(0, 3000) });
        break; // Just get one main source file
      }
    } catch {
      // Skip
    }
  }

  return contents;
}

// Generate documentation using Groq
async function generateDocs(
  repoInfo: RepoInfo,
  files: string[],
  keyFileContents: { path: string; content: string }[]
): Promise<{ readme: string; gettingStarted: string; apiDocs: string }> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const fileListStr = files.join('\n');
  const keyFilesStr = keyFileContents
    .map((f) => `--- ${f.path} ---\n${f.content}`)
    .join('\n\n');

  const prompt = `You are a technical documentation expert. Analyze this GitHub repository and generate comprehensive documentation.

REPOSITORY INFO:
- Name: ${repoInfo.name}
- Description: ${repoInfo.description}
- Primary Language: ${repoInfo.language}
- Stars: ${repoInfo.stars}

FILE STRUCTURE:
${fileListStr}

KEY FILE CONTENTS:
${keyFilesStr}

Generate documentation in the following JSON format:
{
  "readme": "A comprehensive README.md with: project title, description, features, installation, usage examples, configuration options, and contributing guidelines. Use proper markdown formatting.",
  "gettingStarted": "A beginner-friendly getting started guide with: prerequisites, step-by-step installation, first run instructions, common commands, and troubleshooting tips. Use proper markdown formatting.",
  "apiDocs": "API documentation covering: available endpoints/functions, parameters, return values, and code examples. If no API is detected, document the main exports/modules. Use proper markdown formatting."
}

Respond ONLY with valid JSON. Make the documentation detailed, professional, and immediately useful.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a technical documentation expert. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from Groq');
  }

  // Parse JSON response
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr);
    return {
      readme: parsed.readme || '# Documentation\n\nNo README generated.',
      gettingStarted: parsed.gettingStarted || '# Getting Started\n\nNo guide generated.',
      apiDocs: parsed.apiDocs || '# API Documentation\n\nNo API docs generated.',
    };
  } catch {
    // If JSON parsing fails, return the raw content as README
    return {
      readme: content,
      gettingStarted: '# Getting Started\n\nCould not generate structured guide.',
      apiDocs: '# API Documentation\n\nCould not generate API docs.',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl } = body;

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    // Parse GitHub URL
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Please use format: https://github.com/owner/repo' },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // Fetch repo info
    const repoInfo = await fetchRepoInfo(owner, repo);

    // Fetch file tree
    const files = await fetchFileTree(owner, repo);
    repoInfo.files = files;

    // Fetch key file contents
    const keyFileContents = await fetchKeyFiles(owner, repo);

    // Generate documentation
    const docs = await generateDocs(repoInfo, files, keyFileContents);

    return NextResponse.json({
      ...docs,
      repoInfo,
    });
  } catch (error) {
    console.error('Error generating docs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate documentation' },
      { status: 500 }
    );
  }
}
