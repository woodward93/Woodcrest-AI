import React from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  glow?: boolean
  children: React.ReactNode
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  glow = false,
  className, 
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'btn-modern inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300'
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-primary-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-secondary-600 to-secondary-700 text-white hover:from-secondary-700 hover:to-secondary-800 focus:ring-secondary-500 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-primary-300 text-primary-700 bg-white/80 backdrop-blur-xl hover:bg-primary-50 hover:border-primary-400 focus:ring-primary-500',
    ghost: 'text-neutral-700 hover:bg-white/20 backdrop-blur-xl focus:ring-primary-500',
    gradient: 'bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 text-white hover:shadow-glow focus:ring-primary-500 shadow-lg hover:shadow-xl',
    glass: 'bg-white/20 backdrop-blur-xl border border-white/30 text-neutral-800 hover:bg-white/30 focus:ring-primary-500'
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-sm rounded-xl',
    lg: 'px-8 py-4 text-base rounded-xl',
    xl: 'px-10 py-5 text-lg rounded-2xl'
  }

  return (
    <button
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        glow && 'shadow-glow hover:shadow-glow-lg',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
      )}
      {children}
    </button>
  )
}