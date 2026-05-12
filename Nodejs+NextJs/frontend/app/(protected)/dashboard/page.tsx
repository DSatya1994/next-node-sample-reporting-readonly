'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError, type User } from '@/lib/api';

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  user: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.users.list();
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            Application users defined in the server environment configuration
          </p>
        </div>
        <button onClick={fetchUsers} disabled={loading} className="btn-secondary">
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Users', value: total, color: 'text-indigo-600' },
          { label: 'Admins', value: users.filter((u) => u.role === 'admin').length, color: 'text-purple-600' },
          { label: 'Regular Users', value: users.filter((u) => u.role === 'user').length, color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">User List</h2>
          <span className="text-xs text-gray-400">Passwords are never exposed via API</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 gap-3 text-gray-400">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading users…
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-20 text-red-500 text-sm">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="flex justify-center items-center py-20 text-gray-400 text-sm">
            No users configured
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#', 'Username', 'Role', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-400">{user.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center
                                      text-indigo-700 font-bold text-xs uppercase">
                        {user.username.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border
                                     ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
