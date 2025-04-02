"use client";

import { Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  return (
    <div className={cn('text-emerald-600 dark:text-emerald-400', className)}>
      <Dumbbell className={sizeClasses[size]} />
    </div>
  );
}