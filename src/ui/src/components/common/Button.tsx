import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = 'flex items-center justify-center gap-2 rounded-lg font-medium transition-colors shadow-lg';
  
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50',
    secondary: 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5',
    danger: 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30',
    ghost: 'bg-transparent hover:bg-white/10 text-slate-400 hover:text-white shadow-none'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};
