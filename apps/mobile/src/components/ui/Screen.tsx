import React from 'react';
import { ImageBackground, ScrollView, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title?: string;
  statusText?: string | null;
  scroll?: boolean;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  contentClassName?: string;
  style?: ViewStyle;
};

export function Screen({
  title,
  statusText,
  scroll = true,
  children,
  headerRight,
  contentClassName = '',
  style
}: Props) {
  const insets = useSafeAreaInsets();
  const contentTopPadding = 12;

  const content = (
    <View className={`px-4 pt-3 gap-4 ${contentClassName}`} style={style}>
      {title ? (
        <View className="flex-row items-center justify-between">
          <Text className="text-[22px] font-bold text-gray-900">{title}</Text>
          {headerRight ? <View>{headerRight}</View> : null}
        </View>
      ) : null}

      {statusText ? <Text className="text-sm opacity-70">{statusText}</Text> : null}

      {children}
    </View>
  );

  return (
    <ImageBackground
      source={require('../../../assets/sparqplugbg.png')}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
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
      </SafeAreaView>
    </ImageBackground>
  );
}
