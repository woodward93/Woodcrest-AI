import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'glass' | 'gradient' | 'neumorphism'
  hover?: boolean
  glow?: boolean
}

export function Card({ 
  children, 
  className, 
  padding = 'md', 
  variant = 'default',
  hover = true,
  glow = false
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const variantClasses = {
    default: 'bg-white/90 backdrop-blur-xl border border-white/20 shadow-glass',
    glass: 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-glass',
    gradient: 'bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl border border-white/30 shadow-glass',
    neumorphism: 'bg-neutral-50 shadow-neumorphism border-0'
  }

  return (
    <div className={clsx(
      'rounded-2xl transition-all duration-300',
      variantClasses[variant],
      paddingClasses[padding],
      hover && 'hover:shadow-glow hover:-translate-y-1',
      glow && 'shadow-glow',
      className
    )}>
      {children}
    </div>
  )
}