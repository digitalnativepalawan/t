import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'subtle';
  size?: 'sm' | 'md';
  className?: string;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  leftIcon, 
  rightIcon, 
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D0D12] transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
  };

  const variantClasses = {
    primary: 'bg-[#8A5CF6] text-white hover:bg-[#7C4EE3] focus:ring-[#8A5CF6]',
    secondary: 'bg-[#2D2D3A] text-gray-200 hover:bg-[#3c3c4a] focus:ring-[#4a4a5a]',
    subtle: 'bg-transparent text-gray-300 hover:bg-[#2D2D3A] focus:ring-[#4a4a5a]',
  };

  return (
    <button className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
      {/* Fix: Cast icon to React.ReactElement<any> to resolve issue with cloning element and adding className prop. */}
      {leftIcon && React.cloneElement(leftIcon as React.ReactElement<any>, { className: 'mr-2 h-4 w-4' })}
      {children}
      {/* Fix: Cast icon to React.ReactElement<any> to resolve issue with cloning element and adding className prop. */}
      {rightIcon && React.cloneElement(rightIcon as React.ReactElement<any>, { className: 'ml-2 h-4 w-4' })}
    </button>
  );
};

export default Button;