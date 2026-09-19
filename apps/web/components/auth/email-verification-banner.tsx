'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { Mail, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@flowline/ui';

export function EmailVerificationBanner() {
  const { isAuthenticated, isEmailVerified, user, resendVerificationEmail } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  // If user is not logged in or email is already verified, do not render
  if (!isAuthenticated || isEmailVerified || !user) {
    return null;
  }

  const handleResend = async () => {
    setIsSending(true);
    setSentMessage(null);
    try {
      const res = await resendVerificationEmail();
      setSentMessage(res.message || 'Verification link sent to your inbox.');
    } catch {
      setSentMessage('Unable to send verification link at this moment.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full bg-primary/10 border-b border-primary/20 px-4 py-2.5 text-xs text-foreground flex flex-col sm:flex-row items-center justify-between gap-2 transition-all">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary shrink-0" />
        <span>
          <span className="font-semibold text-primary">Verify your email</span> to unlock member invitations and sensitive actions.
        </span>
      </div>

      <div className="flex items-center gap-3">
        {sentMessage ? (
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {sentMessage}
          </span>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSending}
            onClick={handleResend}
            className="h-7 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/20 px-2 py-1 rounded"
          >
            {isSending ? 'Sending...' : 'Resend Email'}
          </Button>
        )}
      </div>
    </div>
  );
}
