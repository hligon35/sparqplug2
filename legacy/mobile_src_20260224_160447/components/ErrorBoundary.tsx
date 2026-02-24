import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { captureException } from "../services/telemetry";

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep it lightweight: console logging only.
    // This is still super useful in Expo dev tools and device logs.
    // If you later add Sentry/Bugsnag, this is the hook.
    // eslint-disable-next-line no-console
    console.error("UI crash", error, info);

    captureException(error, { kind: "ui_crash" }, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
          Something went wrong
        </Text>

        <Text style={{ color: "#374151", marginBottom: 12 }}>
          The app hit an unexpected UI error. You can try to recover without restarting.
        </Text>

        {__DEV__ ? (
          <ScrollView style={{ maxHeight: 260, marginBottom: 12 }}>
            <Text style={{ fontFamily: "monospace", fontSize: 12, color: "#111827" }}>
              {String(this.state.error.stack || this.state.error.message)}
            </Text>
          </ScrollView>
        ) : null}

        <Pressable
          onPress={() => this.setState({ error: null })}
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: "#111827"
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}
