import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppErrorFallback } from '@core/ui/AppErrorFallback';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Bea Guru] UI error:', error.message, info.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <AppErrorFallback error={this.state.error} onReload={this.handleReload} />
      );
    }
    return this.props.children;
  }
}
