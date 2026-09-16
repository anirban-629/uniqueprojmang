import { Suspense } from 'react';
import { ForgotPasswordForm } from '../../../components/auth/forgot-password-form';

export const metadata = {
  title: 'Forgot Password | Flowline',
  description: 'Request a password reset link',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-xl bg-slate-900/60" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
