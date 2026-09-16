import { Suspense } from 'react';
import { RegisterForm } from '../../../components/auth/register-form';

export const metadata = {
  title: 'Create Workspace | Flowline',
  description: 'Create a new multi-tenant agile workspace in Flowline',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-xl bg-slate-900/60" />}>
      <RegisterForm />
    </Suspense>
  );
}
