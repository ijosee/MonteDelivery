import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly children: ReactNode;
  readonly isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  secondary:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-green-500',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost:
    'text-gray-700 hover:bg-gray-100 focus:ring-green-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] px-3 py-2 text-sm',
  md: 'min-h-[44px] px-5 py-2.5 text-sm',
  lg: 'min-h-[48px] px-6 py-3 text-base',
};

/**
 * Button — Componente base de botón accesible.
 * Min touch target 44x44px, visible focus, 4.5:1 contrast.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
