'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@flowline/ui';
import { authClient } from '../../lib/auth/auth-client';
import { Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Password reset token is missing or invalid.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authClient.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-slate-800/80 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {success ? <CheckCircle2 className="h-6 w-6 text-emerald-400" /> : <Lock className="h-6 w-6" />}
        </div>
        <CardTitle className="text-2xl font-bold text-slate-100">
          {success ? 'Password Updated' : 'Set New Password'}
        </CardTitle>
        <CardDescription className="text-slate-400">
          {success
            ? 'Your password has been changed. Redirecting to sign in...'
            : 'Enter and confirm your new account password.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="text-center py-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Go to Sign In <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">New Password</label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9"
                />
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Confirm New Password</label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-9"
                />
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating password...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Update Password <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
