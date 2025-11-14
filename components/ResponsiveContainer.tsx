/**
 * Responsive container component for mobile-first layouts
 */

import React from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
}

/**
 * Container component that adapts to different screen sizes
 * Provides consistent padding and max-width across the application
 */
export function ResponsiveContainer({
  children,
  className = '',
  maxWidth = 'xl',
  padding = true,
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  const paddingClasses = padding ? 'px-4 sm:px-6 lg:px-8' : '';

  return (
    <div className={`mx-auto w-full ${maxWidthClasses[maxWidth]} ${paddingClasses} ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
}

/**
 * Responsive grid component that adapts column count based on screen size
 */
export function ResponsiveGrid({
  children,
  className = '',
  cols = { xs: 1, sm: 2, lg: 3 },
  gap = 4,
}: ResponsiveGridProps) {
  const colClasses = [
    cols.xs ? `grid-cols-${cols.xs}` : '',
    cols.sm ? `sm:grid-cols-${cols.sm}` : '',
    cols.md ? `md:grid-cols-${cols.md}` : '',
    cols.lg ? `lg:grid-cols-${cols.lg}` : '',
    cols.xl ? `xl:grid-cols-${cols.xl}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`grid ${colClasses} gap-${gap} ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'vertical' | 'horizontal';
  breakpoint?: 'sm' | 'md' | 'lg';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
}

/**
 * Stack component that switches between vertical and horizontal layout
 * based on screen size
 */
export function ResponsiveStack({
  children,
  className = '',
  direction = 'vertical',
  breakpoint = 'sm',
  gap = 4,
  align = 'stretch',
}: ResponsiveStackProps) {
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const baseClasses = direction === 'vertical'
    ? `flex flex-col ${breakpoint}:flex-row`
    : `flex flex-row ${breakpoint}:flex-col`;

  return (
    <div className={`${baseClasses} gap-${gap} ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  );
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Mobile menu component with slide-in animation
 */
export function MobileMenu({ isOpen, onClose, children }: MobileMenuProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Menu */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out sm:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}

interface TouchTargetProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  as?: 'button' | 'a' | 'div';
}

/**
 * Ensures minimum touch target size of 44x44px for mobile accessibility
 */
export function TouchTarget({
  children,
  className = '',
  onClick,
  href,
  as = 'button',
}: TouchTargetProps) {
  const baseClasses = 'inline-flex min-h-touch min-w-touch items-center justify-center';

  if (as === 'a' && href) {
    return (
      <a href={href} className={`${baseClasses} ${className}`}>
        {children}
      </a>
    );
  }

  if (as === 'button') {
    return (
      <button onClick={onClick} className={`${baseClasses} ${className}`}>
        {children}
      </button>
    );
  }

  return (
    <div onClick={onClick} className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
}
