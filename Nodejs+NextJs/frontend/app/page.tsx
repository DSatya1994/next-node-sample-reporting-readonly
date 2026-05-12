import { redirect } from 'next/navigation';

// Root "/" always sends the user to the appropriate page.
// Middleware handles the actual auth-based redirect logic.
export default function Home() {
  redirect('/login');
}
