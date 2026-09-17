'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { Building2, Check, ChevronDown, Plus } from 'lucide-react';
import { Badge } from '@flowline/ui';
import Link from 'next/link';

export function TenantSwitcher() {
  const { currentTenant, memberships, switchTenant, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTenant = async (tenantIdOrSlug: string) => {
    if (tenantIdOrSlug === currentTenant?.tenantId || tenantIdOrSlug === currentTenant?.companyId) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      await switchTenant(tenantIdOrSlug);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to switch workspace', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const activeMembership = memberships.find(
    (m) => m.slug === currentTenant?.tenantId || m.companyId === currentTenant?.companyId
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || isSwitching}
        className="flex items-center gap-2 rounded-lg border border-border bg-card/80 px-3 py-1.5 text-xs text-foreground hover:bg-muted/80 hover:border-border transition-all"
      >
        <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="max-w-[120px] truncate font-medium">
          {activeMembership?.name || currentTenant?.tenantId || 'Default Workspace'}
        </span>
        {currentTenant?.role && (
          <Badge variant="primary" className="text-[10px] px-1.5 py-0">
            {currentTenant.role}
          </Badge>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 rounded-xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl z-50">
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Workspaces
          </div>

          <div className="space-y-0.5">
            {memberships.map((membership) => {
              const isSelected =
                membership.slug === currentTenant?.tenantId ||
                membership.companyId === currentTenant?.companyId;

              return (
                <button
                  key={membership.companyId || membership.slug}
                  onClick={() => handleSelectTenant(membership.slug || membership.companyId)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-foreground hover:bg-muted/60'
                  }`}
                >
                  <div className="flex flex-col truncate">
                    <span className="truncate font-medium">{membership.name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{membership.role}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="mt-1.5 border-t border-border pt-1.5">
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create new workspace</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
