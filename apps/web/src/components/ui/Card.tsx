import React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: Props) {
  return <div className={`rounded-2xl border border-gray-200 bg-white p-4 ${className}`}>{children}</div>;
}
