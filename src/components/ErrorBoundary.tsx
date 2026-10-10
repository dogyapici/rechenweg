import { Component, type ReactNode } from 'react';

/** Fängt Anzeige-Fehler ab, damit nie die ganze Seite leer wird. */
export class ErrorBoundary extends Component<{ children: ReactNode; onReset?: () => void }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="err" role="alert">
        <p>Hier ist etwas schiefgelaufen. Fehler: {this.state.error.message}</p>
        <button className="btn quiet" onClick={() => { this.setState({ error: null }); this.props.onReset?.(); }}>Nochmal versuchen</button>
      </div>
    );
  }
}
