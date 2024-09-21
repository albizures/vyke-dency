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

type Context = {
	scope: Scope
	parentInjector?: Injector<Creator>
}

const [getContext, runInContext] = createContext<Context>({
	scope: rootScope,
})

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

type Config = {
	scopeType?: ScopeType
}

type InjectorArgs<TProps> = [TProps] extends [never]
	? { scope?: Scope }
	: {
			scope?: Scope
			props: TProps
		}

type Injector<
	TCreator extends Creator,
	TProps = InferProps<TCreator>,
> = ([TProps] extends [never]
	? (args?: InjectorArgs<never>) => ReturnType<TCreator>
	: (args: InjectorArgs<TProps>) => ReturnType<TCreator>) & {
		/**
		 * Direct dependencies of the creator.
		 */
		deps: Set<Creator>
		/**
		 * The creator function.
		 */
		creator: TCreator
	}

type Args<TProps> = {
	scope?: Scope
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
	TConfig extends Config,
>(creator: TCreator, config?: TConfig): Injector<TCreator> {
	const { scopeType = SINGLETON_SCOPE } = config ?? {}
	const deps = new Set<Creator>()

	const injector = (args?: Args<InferProps<TCreator>>) => {
		const { parentInjector, scope: contextScope } = getContext()

		if (parentInjector) {
			parentInjector.deps.add(creator)
		}

		const { scope = contextScope, props = NO_PROPS } = args ?? {}

		function create() {
			return props === NO_PROPS ? creator() : creator(props)
		}

		if (scopeType === TRANSIENT_SCOPE) {
			return runInContext({ scope, parentInjector: injector }, create)
		}

		const { instances } = scopeType === SINGLETON_SCOPE ? rootScope : scope
		const instance = instances.get(creator)

		if (instance) {
			return instance
		}

		return runInContext({ scope, parentInjector: injector }, () => {
			const newInstance = create()
			instances.set(creator, newInstance)

			return newInstance
		})
	}

	injector.deps = deps
	injector.creator = creator

	return injector
}
