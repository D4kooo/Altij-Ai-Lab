import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-950 p-8">
          <div className="max-w-md text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500" />
            <h1 className="text-xl font-semibold text-white">Une erreur est survenue</h1>
            <p className="text-sm text-slate-400">
              {this.state.error?.message || 'Erreur inattendue'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-turquoise text-white text-sm hover:opacity-90 transition-opacity"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
