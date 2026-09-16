'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authClient } from '../../../lib/auth/auth-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@flowline/ui';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing email verification token.');
      return;
    }

    authClient
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'Your email has been verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Verification link is invalid or has expired.');
      });
  }, [token]);

  return (
    <Card className="w-full max-w-md border-slate-800/80 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          {status === 'verifying' && <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />}
          {status === 'success' && <CheckCircle2 className="h-6 w-6 text-emerald-400" />}
          {status === 'error' && <XCircle className="h-6 w-6 text-rose-400" />}
        </div>
        <CardTitle className="text-2xl font-bold text-slate-100">
          {status === 'verifying' && 'Verifying Email'}
          {status === 'success' && 'Email Verified'}
          {status === 'error' && 'Verification Failed'}
        </CardTitle>
        <CardDescription className="text-slate-400">{message}</CardDescription>
      </CardHeader>
      <CardContent>
        {status !== 'verifying' && (
          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Proceed to Sign In <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-xl bg-slate-900/60" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
