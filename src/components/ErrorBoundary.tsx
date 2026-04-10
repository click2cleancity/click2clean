import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message || 'Something went wrong.' }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
          <p className="text-lg font-semibold text-slate-800">We hit a snag</p>
          <p className="mt-2 text-sm text-slate-600 max-w-sm">{this.state.message}</p>
          <button
            type="button"
            className="mt-6 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white"
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
