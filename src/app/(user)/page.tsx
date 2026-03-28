import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await getCurrentUser();

  if (!session) {
    redirect('/sign-in');
  }

  const userRole = session.user.role;

  if (userRole === 'teacher') {
    redirect('/teacher');
  } else if (userRole === 'student') {
    redirect('/student');
  } else if (userRole === 'admin') {
    redirect('/admin');
  }

  redirect('/teacher');
}
