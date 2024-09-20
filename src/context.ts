type RunInContext<T> = () => T

type ContextUtils<T> = [
  getContext: () => T,
  RunInContext: <R>(context: T, fn: RunInContext<R>) => R,
]

export function createContext<TValue>(context?: TValue): ContextUtils<TValue> {
	function getContext() {
		if (!context) {
			throw new Error('out of context')
		}

		return context
	}

	function runInContext<TResult>(newContext: TValue, fn: RunInContext<TResult>) {
		const oldContext = context

		context = newContext

		const result = fn()

		context = oldContext

		return result
	}

	return [getContext, runInContext]
}
