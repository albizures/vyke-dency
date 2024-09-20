import { createContext } from './context'

export type Creator = (...args: Array<any>) => any

type InferProps<TCreator extends Creator> = Parameters<TCreator> extends [infer TProps, ...infer _TTail]
	? TProps extends undefined
		? never
		: TProps
	: never

export type Scope = {
	readonly instances: Map<Creator, unknown>
	readonly reset: () => void
}

/**
 * Create a new scope.
 * @example
 * ```ts
 * import { createScope, defineDency } from '@vyke/dency'
 *
 * const scope = createScope()
 *
 * const createDep = defineDency()
 *
 * const myDep = createDeps({ scope })
 * ```
 */
export function createScope(): Scope {
	const instances = new Map()
	return {
		instances,
		reset() {
			instances.clear()
		},
	}
}
/**
 * The root scope. it is used by default if no scope is provided.
 */
export const rootScope: Scope = createScope()

const [getScope, runInScope] = createContext(rootScope)

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

type DencyConfig = {
	scopeType?: ScopeType
}

type DencyInjectorArgs<TProps> = [TProps] extends [never]
	? { scope?: Scope }
	: {
			scope?: Scope
			props: TProps
		}

type DencyInjector<
	TCreator extends Creator,
	TProps = InferProps<TCreator>,
> = [TProps] extends [never]
	? (args?: DencyInjectorArgs<never>) => ReturnType<TCreator>
	: (args: DencyInjectorArgs<TProps>) => ReturnType<TCreator>

type Args<TProps> = {
	scope?:	Scope
	props?: TProps
}

const NO_PROPS = Symbol('NO_PROPS')

/**
 * Define a dependency.
 * @example
 * ```ts
 * import { defineDency } from '@vyke/dency'
 *
 * const createDep = defineDency(() => 'Hello, World!')
 *
 * const myDep = createDep()
 *
 * console.log(myDep) // Hello, World!
 * ```
 */
export function defineDency<
	TCreator extends Creator,
	TConfig extends DencyConfig,
>(creator: TCreator, config?: TConfig): DencyInjector<TCreator> {
	const { scopeType = SINGLETON_SCOPE } = config ?? {}

	return (args?: Args<InferProps<TCreator>>) => {
		const { scope = getScope(), props = NO_PROPS } = args ?? {}

		function create() {
			return props === NO_PROPS ? creator() : creator(props)
		}

		if (scopeType === TRANSIENT_SCOPE) {
			return runInScope(scope, create)
		}

		const { instances } = scopeType === SINGLETON_SCOPE ? rootScope : scope
		const instance = instances.get(creator)

		if (instance) {
			return instance
		}

		return runInScope(scope, () => {
			const newInstance = create()
			instances.set(creator, newInstance)

			return newInstance
		})
	}
}
