'use client';

import { useState, useCallback } from 'react';
import { api, ApiError, type DateTimeResponse } from '@/lib/api';

function InfoRow({
  icon,
  label,
  value,
  large = false,
  mono = false,
}: {
  icon: string;
  label: string;
  value: string;
  large?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-xl leading-none mt-0.5">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p
          className={[
            large ? 'text-xl font-bold text-gray-900' : 'text-gray-700',
            mono ? 'font-mono text-sm' : '',
          ].join(' ')}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function DateTimePage() {
  const [data, setData] = useState<DateTimeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchDateTime = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.datetime.get();
      setData(result);
      setLastFetched(new Date());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to fetch date/time');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Server Date &amp; Time</h1>
        <p className="text-sm text-gray-500 mt-1">
          Retrieves the current date and time from the Node.js server
        </p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Action card */}
        <div className="card flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Fetch Current Time</h2>
            {lastFetched ? (
              <p className="text-xs text-gray-400 mt-1">
                Last fetched at {lastFetched.toLocaleTimeString()}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Not fetched yet</p>
            )}
          </div>
          <button onClick={fetchDateTime} disabled={loading} className="btn-primary gap-2">
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Fetching…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Fetch Date &amp; Time
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {data && (
          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-900 pb-3 border-b border-gray-100">
              Server Response
            </h2>
            <InfoRow icon="📅" label="Date" value={data.date} large />
            <InfoRow icon="🕐" label="Time" value={data.time} large />
            <InfoRow icon="🌍" label="Timezone" value={data.timezone} />
            <InfoRow icon="📋" label="ISO 8601" value={data.iso} mono />
            <InfoRow icon="🌐" label="UTC" value={data.utc} mono />
            <InfoRow icon="#" label="Unix Timestamp (ms)" value={data.timestamp.toString()} mono />
          </div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div className="card text-center py-16">
            <div className="text-5xl mb-3">🕐</div>
            <p className="text-gray-500">
              Click <span className="font-semibold">Fetch Date &amp; Time</span> to retrieve
              the current server time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
