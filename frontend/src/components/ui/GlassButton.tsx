import React, { ButtonHTMLAttributes } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export const GlassButton: React.FC<GlassButtonProps> = ({ className = '', children, ...props }) => {
  return (
    <button
      className={`
        bg-white/20 dark:bg-black/20 
        backdrop-blur-lg 
        rounded-2xl 
        border border-white/30 dark:border-white/10
        transition-all duration-300 
        hover:scale-105 hover:bg-white/40 dark:hover:bg-white/10
        px-6 py-3 font-medium text-inherit
        shadow-[0_4px_30px_rgba(0,0,0,0.1)]
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
