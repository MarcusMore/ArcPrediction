import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false, ...props }) => {
  return (
    <motion.div
      className={`
        bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl
        ${hoverEffect ? 'hover:border-primary/50 hover:shadow-primary/20 transition-all duration-300' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/30",
    secondary: "bg-secondary hover:bg-cyan-400 text-black shadow-lg shadow-secondary/30",
    accent: "bg-accent hover:bg-pink-600 text-white shadow-lg shadow-accent/30",
    outline: "bg-transparent border-2 border-white/20 hover:border-white/50 text-white",
    ghost: "bg-transparent hover:bg-white/10 text-white/70 hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export const Badge: React.FC<{ children: ReactNode; type?: 'trend' | 'new' | 'neutral' }> = ({ children, type = 'neutral' }) => {
  const styles = {
    trend: 'bg-accent/20 text-accent border-accent/50',
    new: 'bg-secondary/20 text-secondary border-secondary/50',
    neutral: 'bg-white/10 text-white/60 border-white/20',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-mono rounded-full border ${styles[type]}`}>
      {children}
    </span>
  );
};
