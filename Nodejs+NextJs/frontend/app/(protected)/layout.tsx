import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';

/**
 * Decodes the JWT payload without verification (for display only).
 * Verification happens in middleware.ts before this layout ever runs.
 */
function decodeJWTPayload(token: string): { username?: string } | null {
  try {
    const base64 = token.split('.')[1];
    // atob is available in the Node.js 18+ runtime used by Next.js
    const json = Buffer.from(base64, 'base64url').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = decodeJWTPayload(token);
  const username = payload?.username ?? 'User';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar username={username} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
