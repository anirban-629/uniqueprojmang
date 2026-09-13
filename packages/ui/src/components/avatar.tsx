import * as React from 'react';
import { cn } from '../utils';

export interface AvatarProps {
  name: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base'
};

export function Avatar({ name, avatar, size = 'sm', className }: AvatarProps) {
  const [error, setError] = React.useState(false);

  const initials = name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Deterministic subtle pastel colors based on name
  const colors = [
    'bg-indigo-600/30 text-indigo-300 border-indigo-500/30',
    'bg-emerald-600/30 text-emerald-300 border-emerald-500/30',
    'bg-amber-600/30 text-amber-300 border-amber-500/30',
    'bg-cyan-600/30 text-cyan-300 border-cyan-500/30',
    'bg-fuchsia-600/30 text-fuchsia-300 border-fuchsia-500/30'
  ];
  const colorIndex = Math.abs(name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length;

  return (
    <div
      title={name}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full font-medium select-none overflow-hidden shrink-0 border',
        sizeClasses[size],
        colors[colorIndex],
        className
      )}
    >
      {avatar && !error ? (
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
