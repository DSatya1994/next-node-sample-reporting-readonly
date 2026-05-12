'use client';

import { useState, useEffect } from 'react';
import { api, ApiError, type QueryCode, type QueryResult } from '@/lib/api';
import JsonViewer from '@/components/JsonViewer';

export default function QueryPage() {
  const [codes, setCodes] = useState<QueryCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [inputCode, setInputCode] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  // Load available query codes on mount
  useEffect(() => {
    api.query
      .codes()
      .then((d) => setCodes(d.codes))
      .catch(() => setCodes([]))
      .finally(() => setCodesLoading(false));
  }, []);

  const handleRun = async () => {
    const code = inputCode.trim();
    if (!code) {
      setError('Please enter a query code');
      return;
    }
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const data = await api.query.run(code);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Query execution failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Database Query</h1>
        <p className="text-sm text-gray-500 mt-1">
          Execute predefined read-only queries against the configured MSSQL database
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: available codes ───────────────────────────────────────── */}
        <div className="card h-fit">
          <h2 className="font-semibold text-gray-900 mb-1">Query Codes</h2>
          <p className="text-xs text-gray-400 mb-3">
            Defined in <code className="bg-gray-100 px-1 rounded">backend/src/config/queries.json</code>
          </p>

          {codesLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : codes.length === 0 ? (
            <p className="text-sm text-gray-400">
              No codes available — check DB connection or queries.json
            </p>
          ) : (
            <div className="space-y-2">
              {codes.map(({ code, preview }) => (
                <button
                  key={code}
                  onClick={() => setInputCode(code)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    inputCode === code
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-mono text-sm font-semibold text-indigo-600">{code}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{preview}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: runner + results ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Input row */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query Code
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                className="input-field font-mono"
                placeholder="e.g. GET_TABLES"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleRun()}
              />
              <button
                onClick={handleRun}
                disabled={running || !inputCode.trim()}
                className="btn-primary whitespace-nowrap gap-2"
              >
                {running ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Running…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Run Query
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Press{' '}
              <kbd className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 text-xs">
                Enter
              </kbd>{' '}
              or click Run Query · Code is matched case-insensitively
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="card space-y-4">
              {/* Meta row */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="font-mono text-sm font-semibold text-indigo-600">
                    {result.code}
                  </span>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{result.rowCount} row{result.rowCount !== 1 ? 's' : ''}</span>
                    {result.columns.length > 0 && (
                      <span>{result.columns.length} column{result.columns.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(result.executedAt).toLocaleTimeString()}
                </span>
              </div>

              {/* Column chips */}
              {result.columns.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {result.columns.map((col) => (
                    <span
                      key={col}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono border border-gray-200"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              )}

              {/* JSON output */}
              <JsonViewer data={result.data} maxHeight="520px" />
            </div>
          )}

          {/* Empty state */}
          {!result && !running && !error && (
            <div className="card text-center py-16">
              <div className="text-5xl mb-3">🗄️</div>
              <p className="text-gray-500">
                Select a code from the panel or type one above, then click{' '}
                <span className="font-semibold">Run Query</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
