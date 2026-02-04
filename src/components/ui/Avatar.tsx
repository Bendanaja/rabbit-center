'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn, getInitials } from '@/lib/utils';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy';
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
  sm: { container: 'h-8 w-8', text: 'text-xs', status: 'h-2 w-2' },
  md: { container: 'h-10 w-10', text: 'text-sm', status: 'h-2.5 w-2.5' },
  lg: { container: 'h-12 w-12', text: 'text-base', status: 'h-3 w-3' },
  xl: { container: 'h-16 w-16', text: 'text-lg', status: 'h-4 w-4' },
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-neutral-400',
  busy: 'bg-red-500',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name = '', size = 'md', status, ...props }, ref) => {
    const styles = sizeStyles[size];
    const initials = getInitials(name);

    return (
      <div ref={ref} className={cn('relative inline-block', className)} {...props}>
        <div
          className={cn(
            'rounded-full overflow-hidden flex items-center justify-center',
            'bg-gradient-to-br from-primary-400 to-primary-600',
            styles.container
          )}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt || name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className={cn('font-medium text-white', styles.text)}>
              {initials || '?'}
            </span>
          )}
        </div>
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-neutral-900',
              styles.status,
              statusColors[status]
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// AI Avatar component for chat messages
interface AIAvatarProps extends HTMLAttributes<HTMLDivElement> {
  modelIcon?: string;
  size?: AvatarSize;
}

export const AIAvatar = forwardRef<HTMLDivElement, AIAvatarProps>(
  ({ className, modelIcon = '🤖', size = 'md', ...props }, ref) => {
    const styles = sizeStyles[size];

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-full flex items-center justify-center',
          'bg-neutral-100 dark:bg-neutral-800',
          styles.container,
          className
        )}
        {...props}
      >
        <span className={styles.text}>{modelIcon}</span>
      </div>
    );
  }
);

AIAvatar.displayName = 'AIAvatar';
