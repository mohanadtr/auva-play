import { Component } from 'react';
import { BTN_SECONDARY } from '../utils/buttonClasses';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <p className="error-boundary__title">Something went wrong.</p>
          <button
            type="button"
            className={BTN_SECONDARY}
            onClick={() => window.location.reload()}
          >
            Refresh the page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
