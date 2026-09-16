'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@flowline/ui';
import { useAuth } from '../../hooks/use-auth';
import { Building2, User as UserIcon, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        fullName,
        tenantName,
        email,
        password,
      });
      router.push('/board');
    } catch (err: any) {
      setError(err.message || 'Failed to create workspace account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-slate-800/80 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Building2 className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-100">Create Workspace</CardTitle>
        <CardDescription className="text-slate-400">
          Get started with multi-tenant agile management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Your Full Name</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Alex Rivera"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="pl-9"
              />
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Workspace / Company Name</label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Acme Corp"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
                className="pl-9"
              />
              <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Work Email</label>
            <div className="relative">
              <Input
                type="email"
                placeholder="alex@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9"
              />
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Password (min 8 chars)</label>
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

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Setting up...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Create Account <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <div className="pt-2 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
