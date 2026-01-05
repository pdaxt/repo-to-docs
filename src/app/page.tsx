'use client';

import { useState } from 'react';

interface GeneratedDocs {
  readme: string;
  gettingStarted: string;
  apiDocs: string;
  repoInfo: {
    name: string;
    description: string;
    language: string;
    stars: number;
    files: string[];
  };
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [docs, setDocs] = useState<GeneratedDocs | null>(null);
  const [activeTab, setActiveTab] = useState<'readme' | 'getting-started' | 'api'>('readme');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDocs(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate docs');
      }

      const data = await response.json();
      setDocs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Repo-to-Docs</h1>
              <p className="text-xs text-slate-400">AI-powered documentation generator</p>
            </div>
          </div>
          <a
            href="https://github.com/pdaxt"
            target="_blank"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            by Pranjal Gupta
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Generate docs from any
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent"> GitHub repo</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Paste a GitHub URL and get instant README, getting started guide, and API documentation powered by AI.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto mb-12">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !repoUrl}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {docs && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
            {/* Repo Info */}
            <div className="p-6 border-b border-slate-700/50 bg-slate-800/50">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{docs.repoInfo.name}</h3>
                  <p className="text-slate-400">{docs.repoInfo.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                    {docs.repoInfo.language || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    ⭐ {docs.repoInfo.stars}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700/50">
              {[
                { id: 'readme', label: 'README.md' },
                { id: 'getting-started', label: 'Getting Started' },
                { id: 'api', label: 'API Docs' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-slate-900/50 rounded-xl p-6 overflow-auto max-h-[600px]">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                  {activeTab === 'readme' && docs.readme}
                  {activeTab === 'getting-started' && docs.gettingStarted}
                  {activeTab === 'api' && docs.apiDocs}
                </pre>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    const content = activeTab === 'readme' ? docs.readme : activeTab === 'getting-started' ? docs.gettingStarted : docs.apiDocs;
                    navigator.clipboard.writeText(content);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => {
                    const content = activeTab === 'readme' ? docs.readme : activeTab === 'getting-started' ? docs.gettingStarted : docs.apiDocs;
                    const filename = activeTab === 'readme' ? 'README.md' : activeTab === 'getting-started' ? 'GETTING_STARTED.md' : 'API.md';
                    const blob = new Blob([content], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features (when no docs) */}
        {!docs && !loading && (
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
            {[
              {
                icon: '📄',
                title: 'README Generation',
                description: 'Auto-generate comprehensive README with project overview, installation, and usage.',
              },
              {
                icon: '🚀',
                title: 'Getting Started Guide',
                description: 'Step-by-step setup instructions tailored to your tech stack.',
              },
              {
                icon: '📚',
                title: 'API Documentation',
                description: 'Extract and document API endpoints, functions, and interfaces.',
              },
            ].map((feature) => (
              <div key={feature.title} className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-slate-500">
          Built by{' '}
          <a href="https://linkedin.com/in/pran-dataxlr8" className="text-emerald-400 hover:underline">
            Pranjal Gupta
          </a>
          {' '}• Founder @{' '}
          <a href="https://dataxlr8.ai" className="text-emerald-400 hover:underline">
            DataXLR8.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
