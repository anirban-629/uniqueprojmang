import React from 'react';
import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { EmailVerificationBanner } from '@/components/auth/email-verification-banner';

export default function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col">
      <EmailVerificationBanner />
      <AppHeader />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-background p-4 sm:p-5">
          <div className="mx-auto max-w-[1800px] w-full flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
