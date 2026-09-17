'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { InviteLandingForm } from '../../../components/auth/invite-landing-form';

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  return <InviteLandingForm token={token} />;
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
