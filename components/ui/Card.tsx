import React from 'react';

// Fix: Extend CardProps to accept all div element attributes, allowing props like 'id' to be passed through.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-[#1A1A23] border border-[#2D2D3A] rounded-xl shadow-lg p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;