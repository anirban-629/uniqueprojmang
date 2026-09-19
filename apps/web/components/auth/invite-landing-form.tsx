'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@flowline/ui';
import { authClient, type InviteDetailsResponse } from '../../lib/auth/auth-client';
import { useAuth } from '../../hooks/use-auth';
import { UserCheck, User as UserIcon, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, XCircle } from 'lucide-react';

interface InviteLandingFormProps {
  token: string;
}

export function InviteLandingForm({ token }: InviteLandingFormProps) {
  const router = useRouter();
  const { acceptInvite, login } = useAuth();

  const [inviteDetails, setInviteDetails] = useState<InviteDetailsResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExistingUserMode, setIsExistingUserMode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDetails() {
      if (!token) {
        setIsLoadingDetails(false);
        return;
      }
      try {
        const details = await authClient.getInviteDetails(token);
        if (isMounted) {
          setInviteDetails(details);
        }
      } catch {
        if (isMounted) {
          setInviteDetails(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      }
    }
    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invitation token is missing.');
      return;
    }

    if (password.length < 10) {
      setError('Password must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isExistingUserMode) {
        // If user already has an account, accept invite with password
        await acceptInvite({
          token,
          password,
        });
      } else {
        // New user onboarding
        await acceptInvite({
          token,
          password,
          fullName,
        });
      }
      router.push('/board');
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDetails) {
    return (
      <Card className="w-full max-w-md border-border bg-card/90 shadow-2xl backdrop-blur-xl p-8 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Verifying invitation link...</p>
      </Card>
    );
  }

  if (!token || !inviteDetails || !inviteDetails.isValid) {
    return (
      <Card className="w-full max-w-md border-border bg-card/90 shadow-2xl backdrop-blur-xl text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Invitation Invalid or Expired</CardTitle>
          <CardDescription className="text-muted-foreground">
            This invitation link is either invalid, already used, or has expired. Please ask your workspace administrator to resend an invite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground">
              Return to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border bg-card/90 shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <UserCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">Accept Invitation</CardTitle>
        <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 text-xs text-foreground leading-relaxed">
          <span className="font-semibold text-primary">{inviteDetails.inviterName || 'A team member'}</span> has invited you to join{' '}
          <span className="font-semibold text-foreground">{inviteDetails.tenantName}</span> as a{' '}
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-primary/20 text-primary uppercase tracking-wider">
            {inviteDetails.role}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Locked pre-filled email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Invited Email</label>
            <div className="relative">
              <Input
                type="email"
                value={inviteDetails.email}
                disabled
                className="pl-9 bg-muted/50 cursor-not-allowed opacity-80"
              />
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {!isExistingUserMode && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Your Full Name</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isExistingUserMode}
                  className="pl-9"
                />
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              {isExistingUserMode ? 'Account Password' : 'Create Password (min 10 characters)'}
            </label>
            <div className="relative">
              <Input
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9"
              />
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-lg transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Joining workspace...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Join {inviteDetails.tenantName} <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <div className="pt-2 text-center text-xs text-muted-foreground">
            {isExistingUserMode ? (
              <button
                type="button"
                onClick={() => setIsExistingUserMode(false)}
                className="font-semibold text-primary hover:underline"
              >
                New user? Create a profile instead
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsExistingUserMode(true)}
                className="font-semibold text-primary hover:underline"
              >
                Already have an account with this email? Sign in to join
              </button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
