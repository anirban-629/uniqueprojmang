import { Suspense } from 'react';
import { ResetPasswordForm } from '../../../components/auth/reset-password-form';

export const metadata = {
  title: 'Reset Password | Flowline',
  description: 'Set a new password for your Flowline account',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-xl bg-slate-900/60" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
