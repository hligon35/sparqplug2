import React from 'react';
import { ImageBackground, ScrollView, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDebug } from '../../hooks/useDebug';

type Props = {
  title?: string;
  statusText?: string | null;
  scroll?: boolean;
  children: React.ReactNode;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  contentClassName?: string;
  style?: ViewStyle;
};

export function Screen({
  title,
  statusText,
  scroll = true,
  children,
  headerLeft,
  headerRight,
  contentClassName = '',
  style
}: Props) {
  const insets = useSafeAreaInsets();
  const debug = useDebug();
  const contentTopPadding = 16;
  const debugBounds = debug?.enabled && debug.toggles.showLayoutBounds;

  const content = (
    <View
      className={`px-4 pt-4 gap-4 ${debugBounds ? 'border border-red-500 border-dashed' : ''} ${contentClassName}`}
      style={style}
    >
      {statusText ? <Text className="text-sm opacity-70">{statusText}</Text> : null}

      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {(title || headerLeft || headerRight) && (
        <View className="px-4 py-3 flex-row items-center justify-between bg-white">
          <View className="w-12 h-12 items-start justify-center">{headerLeft ?? null}</View>
          <View className="flex-1 items-center justify-center">
            {title ? <Text className="text-[22px] font-bold text-gray-900">{title}</Text> : null}
          </View>
          <View className="w-12 h-12 items-end justify-center">{headerRight ?? null}</View>
        </View>
      )}

      <ImageBackground source={require('../../../assets/sparqplugbg.png')} resizeMode="cover" style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: contentTopPadding }}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={{ paddingTop: contentTopPadding, paddingBottom: insets.bottom + 24, flex: 1 }}>
            {content}
          </View>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}
