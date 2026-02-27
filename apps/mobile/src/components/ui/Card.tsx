import React from 'react';
import { View, type ViewProps } from 'react-native';

import { useDebug } from '../../hooks/useDebug';

type Props = ViewProps & {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = '', ...rest }: Props) {
  const debug = useDebug();
  const debugBounds = debug?.enabled && debug.toggles.showLayoutBounds;
  return (
    <View
      className={`rounded-2xl border border-gray-200 bg-white p-4 ${
        debugBounds ? 'border-red-500 border-dashed' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
