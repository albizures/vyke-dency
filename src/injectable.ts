import { createContext } from './context'

type Context = {
	scope: Scope
	parentCreator?: AnyInjectable
}

/**
 * The root scope. It is used by default if no scope is provided.
 */
export const rootScope: Scope = createScope('root')

const [getContext, runInContext] = createContext<Context>({
	scope: rootScope,
})

export type Scope = {
	readonly id?: string
	readonly instances: Map<AnyInjectable, unknown>
	readonly reset: () => void
	readonly inject: <TArgs extends Array<any>, TReturn>(
		injectable: Injectable<TArgs, TReturn>,
		...args: TArgs
	) => TReturn
	readonly use: <TArgs extends Array<any>, TReturn>(
		injectable: Injectable<TArgs, TReturn>,
	) => TReturn | undefined
}

/**
 * Create a new scope.
 * @example
 * ```ts
 * import { createScope, defineInjectable } from '@vyke/dency'
 *
 * const scope = createScope()
 *
 * const createDep = defineInjectable(() => 'foo', {
 * 	scopeType: SCOPED_SCOPE
 * })
 *
 * const myDep = scope.inject(createDep)
 * ```
 */
export function createScope(id?: string): Scope {
	const instances = new Map()
	const scope: Scope = {
		id,
		instances,
		reset() {
			instances.clear()
		},
		inject<TArgs extends Array<any>, TReturn>(injectable: Injectable<TArgs, TReturn>, ...args: TArgs): TReturn {
			return runInContext({ scope, parentCreator: injectable }, () => {
				return inject(injectable, ...args)
			})
		},
		use<TArgs extends Array<any>, TReturn>(injectable: Injectable<TArgs, TReturn>): TReturn | undefined {
			return runInContext({ scope }, () => {
				return use(injectable)
			})
		},
	}

	return scope
}

/**
 * Singleton scope type.
 */
export const SINGLETON_SCOPE = 0 as const
/**
 * Transient scope type.
 */
export const TRANSIENT_SCOPE = 1 as const
/**
 * Scoped scope type.
 */
export const SCOPED_SCOPE = 2 as const

/**
 * Scope types.
 */
export const SCOPE_TYPE = {
	SINGLETON: SINGLETON_SCOPE,
	TRANSIENT: TRANSIENT_SCOPE,
	SCOPED: SCOPED_SCOPE,
}

/**
 * Scope type.
 */
export type ScopeType = typeof SCOPE_TYPE[keyof typeof SCOPE_TYPE]

export type Injectable<TArgs extends Array<any>, TReturn> = {
	creator: (...args: TArgs) => TReturn
	scopeType: ScopeType
	deps: Set<AnyInjectable>
}

type AnyInjectable = Injectable<Array<any>, any>

type DefineInjectableArgs = {
	scopeType?: ScopeType
}

/**
 * Defines an injectable and returns it.
 * @example
 * ```ts
 * import { defineInjectable, SINGLETON_SCOPE } from '@vyke/dency'
 *
 * const createDep1 = defineInjectable(() => {
 *  return 'Hello, World!'
 * }, { scopeType: SINGLETON_SCOPE })
 * const createDep2 = defineInjectable(() => {
 * return 'Hello, World!'
 * }) // Default scope type is SINGLETON_SCOPE
 * ```
 */
export function defineInjectable<
	TArgs extends Array<any>, TReturn,
>(creator: (...args: TArgs) => TReturn, args: DefineInjectableArgs = {}): Injectable<TArgs, TReturn> {
	const { scopeType = SINGLETON_SCOPE } = args
	const injectable: Injectable<TArgs, TReturn> = {
		creator,
		scopeType,
		deps: new Set(),
	}

	return injectable
}

/**
 * Injects an injectable and returns the instance.
 * @example
 * ```ts
 * import { defineInjectable, inject, SINGLETON_SCOPE } from '@vyke/dency'
 * const createDep = defineInjectable(() => {
 * return 'Hello, World'
 * }, { scopeType: SINGLETON_SCOPE })
 * const dep = inject(createDep) // can be used anywhere
 *
 * console.log(dep) // Hello, World
 *
 * // but usually, it is used inside another injectable
 * const createDep1 = defineInjectable((dep = inject(createDep)) => {
 * 	return `${dep}!`
 * })
 *
 * console.log(inject(createDep1)) // Hello, World!
 * ```
 */
export function inject<TArgs extends Array<any>, TReturn>(injectable: Injectable<TArgs, TReturn>, ...args: TArgs) {
	const { scopeType = SINGLETON_SCOPE } = injectable
	const { parentCreator, scope } = getContext()

	if (parentCreator) {
		parentCreator.deps.add(injectable)
	}

	function create() {
		return injectable.creator(...args)
	}

	if (scopeType === TRANSIENT_SCOPE) {
		return runInContext({ scope, parentCreator: injectable }, create)
	}

	const { instances } = scopeType === SINGLETON_SCOPE ? rootScope : scope

	const instance = instances.get(injectable)

	if (instance) {
		return instance as TReturn
	}

	return runInContext({ scope, parentCreator: injectable }, () => {
		const newInstance = create()

		instances.set(injectable, newInstance)

		return newInstance
	})
}

/**
 * Returns the instance of an injectable if it exists.
 * @example
 * ```ts
 * import { defineInjectable, SINGLETON_SCOPE, use } from '@vyke/dency'
 * const createDep = defineInjectable(() => {
 * return 'Hello, World'
 * })
 *
 * const dep = use(createDep) // probably undefined
 * ```
 */
export function use<TArgs extends Array<any>, TReturn>(injectable: Injectable<TArgs, TReturn>): TReturn | undefined {
	const { scopeType = SINGLETON_SCOPE } = injectable
	const { scope } = getContext()

	const { instances } = scopeType === SINGLETON_SCOPE ? rootScope : scope

	const instance = instances.get(injectable)

	if (instance) {
		return instance as TReturn
	}

	return undefined
}
