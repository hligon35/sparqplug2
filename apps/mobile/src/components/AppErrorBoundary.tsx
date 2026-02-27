import React from 'react';
import { Text, View } from 'react-native';

import { Screen } from './ui/Screen';
import { Card } from './ui/Card';
import { useDebug } from '../hooks/useDebug';
import { debugLog } from '../debug/debugStore';

// AppErrorBoundary: wraps root providers/navigation to prevent hard crashes.
// When debug mode is enabled, it can show a more detailed overlay.

type State = { error: Error | null };

type Props = {
  children: React.ReactNode;
};

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    debugLog('error', 'error-boundary', error.message, { stack: error.stack, info });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <ErrorFallback error={this.state.error} onReset={() => this.setState({ error: null })} />;
  }
}

function ErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  const debug = useDebug();

  return (
    <Screen title="Something went wrong" scroll={false}>
      <Card>
        <Text className="text-base font-semibold text-gray-900">The app hit an unexpected error.</Text>
        <View className="h-3" />
        <Text className="text-sm opacity-70">Try again, or open Debug mode for details.</Text>
        <View className="h-4" />
        <Text className="text-sm font-semibold text-gray-900" onPress={onReset}>
          Tap here to retry
        </Text>

        {debug?.enabled && debug.toggles.showErrorOverlay ? (
          <View className="mt-4">
            <Text className="text-xs opacity-70">{error.message}</Text>
            {error.stack ? <Text className="text-xs opacity-70 mt-2">{error.stack}</Text> : null}
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
