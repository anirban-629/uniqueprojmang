'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@flowline/ui';
import { authClient } from '../../lib/auth/auth-client';
import { Mail, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await authClient.forgotPassword(email);
    } catch {
      // Intentionally suppress specific enumeration errors per backend design
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <Card className="w-full max-w-md border-slate-800/80 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {submitted ? <CheckCircle2 className="h-6 w-6 text-emerald-400" /> : <Mail className="h-6 w-6" />}
        </div>
        <CardTitle className="text-2xl font-bold text-slate-100">
          {submitted ? 'Check Your Inbox' : 'Reset Password'}
        </CardTitle>
        <CardDescription className="text-slate-400">
          {submitted
            ? `If an account exists for ${email}, a password reset link has been dispatched.`
            : 'Enter your work email address and we will send you a reset link.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="space-y-4">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9"
                />
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
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
                  Sending link...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Send Reset Link <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            <div className="pt-2 text-center text-xs text-slate-400">
              <Link href="/login" className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200">
                <ArrowLeft className="h-3 w-3" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
