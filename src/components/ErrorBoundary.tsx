import React, { ErrorInfo, ReactNode } from 'react';
import { Page500 } from './pages/Page500';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught runtime error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#ebedef] dark:bg-[#131924] flex items-center justify-center p-4">
          <Page500 />
        </div>
      );
    }

    return (this as any).props.children;
  }
}
