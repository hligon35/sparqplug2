import React from 'react';
import { View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = '', ...rest }: Props) {
  return (
    <View
      className={`rounded-2xl border border-gray-200 bg-white p-4 ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
