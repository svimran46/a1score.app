"use client";

import React, { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[SectionErrorBoundary] Error in section ${this.props.sectionName || "unknown"}:`,
      error,
      errorInfo
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const message =
        this.props.fallbackMessage ||
        (this.props.sectionName
          ? `Couldn't load ${this.props.sectionName}`
          : "Couldn't load this section");

      return (
        <div className="rounded-2xl glass-panel p-4 sm:p-5 border border-amber-500/20 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition-all">
          <div className="flex items-center gap-2.5 text-slate-300 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{message}</span>
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors shadow-sm active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
