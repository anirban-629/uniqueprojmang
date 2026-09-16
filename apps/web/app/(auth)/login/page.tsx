import { Suspense } from 'react';
import { LoginForm } from '../../../components/auth/login-form';

export const metadata = {
  title: 'Sign In | Flowline',
  description: 'Sign in to your Flowline workspace',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-xl bg-slate-900/60" />}>
      <LoginForm />
    </Suspense>
  );
}
