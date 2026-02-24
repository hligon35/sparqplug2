import React from "react";
import { ImageBackground, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";

type Props = {
  subtitle?: string;
  statusText?: string | null;
  overlay?: React.ReactNode;
  contentInsetClassName?: string;
  scroll?: boolean;
  safeAreaTop?: boolean;
  safeAreaBottom?: boolean;
  safeAreaHorizontal?: boolean;
  children: React.ReactNode;
};

export function Screen({
  subtitle,
  statusText,
  overlay,
  contentInsetClassName = "px-4",
  scroll = true,
  safeAreaTop = false,
  safeAreaBottom = true,
  safeAreaHorizontal = true,
  children
}: Props) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = React.useContext(BottomTabBarHeightContext) ?? 0;

  // Consistent space between the native header and the screen body.
  const contentTopPadding = 12;

  // If we're inside a bottom-tab navigator, the tab bar height already includes the bottom safe-area.
  // Outside of tabs, fall back to the safe-area inset.
  const bottomInset = tabBarHeight > 0 ? tabBarHeight : safeAreaBottom ? insets.bottom : 0;

  return (
    <ImageBackground
      source={require("../../../assets/sparqplugbg.png")}
      className="flex-1"
      resizeMode="cover"
    >
      <View
        className="flex-1"
        style={{
          paddingTop: safeAreaTop ? insets.top : 0,
          paddingBottom: 0,
          paddingLeft: safeAreaHorizontal ? insets.left : 0,
          paddingRight: safeAreaHorizontal ? insets.right : 0
        }}
      >
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: contentTopPadding,
              paddingBottom: bottomInset + 24
            }}
            showsVerticalScrollIndicator={false}
          >
            <View className={`${contentInsetClassName} gap-4`}>{children}</View>
          </ScrollView>
        ) : (
          <View
            className={`flex-1 ${contentInsetClassName} gap-4`}
            style={{ paddingTop: contentTopPadding, paddingBottom: bottomInset + 24 }}
          >
            {children}
          </View>
        )}

        {overlay ? (
          <View
            pointerEvents="box-none"
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          >
            {overlay}
          </View>
        ) : null}
      </View>
    </ImageBackground>
  );
}
