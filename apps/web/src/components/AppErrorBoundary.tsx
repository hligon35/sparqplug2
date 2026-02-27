import React from 'react';

import { Card } from './ui/Card';
import { WebScreen } from './ui/WebScreen';
import { useDebug } from '../hooks/useDebug';
import { debugLog } from '../debug/debugStore';

// AppErrorBoundary: wraps root providers/router to prevent full app blank screens.
// When debug mode is enabled, it can show error details.

type State = { error: Error | null };

type Props = { children: React.ReactNode };

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
    <WebScreen title="Something went wrong" statusText="The app hit an unexpected error.">
      <Card>
        <div className="text-base font-semibold text-[#111827]">Try again, or enable Debug mode for details.</div>
        <div className="h-4" />
        <button type="button" className="text-sm font-semibold" onClick={onReset}>
          Retry
        </button>

        {debug?.enabled && debug.toggles.showErrorOverlay ? (
          <div className="mt-4 text-xs opacity-70 whitespace-pre-wrap">{String(error.stack || error.message)}</div>
        ) : null}
      </Card>
    </WebScreen>
  );
}
