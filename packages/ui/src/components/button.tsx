import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 hover:shadow-indigo-500/25',
        primary:
          'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-700 hover:shadow-indigo-500/30',
        destructive:
          'bg-rose-600 text-white shadow-sm hover:bg-rose-500 hover:shadow-rose-500/25',
        outline:
          'border border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800 hover:text-white',
        secondary:
          'bg-slate-800 text-slate-100 hover:bg-slate-700 shadow-sm',
        ghost:
          'text-slate-300 hover:bg-slate-800/70 hover:text-white',
        link:
          'text-indigo-400 underline-offset-4 hover:underline hover:text-indigo-300'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-base font-semibold',
        icon: 'h-9 w-9 p-0'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
