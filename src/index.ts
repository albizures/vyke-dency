import { Sola } from '@vyke/sola'

export type AnyDeps = Array<DencyId<any>>

export type ExtractType<T> = T extends { __type: infer TType } ? TType : never
export type TupleIdToDencies<T> =
	T extends readonly [infer THead, ...infer TTail]
		? [ExtractType<THead>, ...TupleIdToDencies<TTail>]
		: T extends readonly [infer TLast]
			? [ExtractType<TLast>]
			: []

type Class<TType, Arguments extends Array<any> = Array<any>> = {
	prototype: Pick<TType, keyof TType>
	new(...arguments_: Arguments): TType
}

export type DencyClass<TType, TDeps> = Class<TType, TupleIdToDencies<TDeps>>
export type DencyFactory<TType, TDeps> = {
	(...arguments_: TupleIdToDencies<TDeps>): TType
}

export type SpecificDency<TType> = ({
	instanceType: 'singleton'
	instance?: TType
} | {
	instanceType: 'transient'
} | {
	instanceType: 'scoped'
	scopes: Map<string, TType>
})
export type Dency<TType, TDeps> = SpecificDency<TType> & ({
	type: 'factory'
	factory: DencyFactory<TType, TDeps>
	deps: Readonly<TDeps>
})

type AnyDency = SpecificDency<any> & ({
	type: 'factory'
	factory: {
		(...arguments_: Array<any>): any

	}
	deps: ReadonlyArray<any>
})
export type DencyType = AnyDency['type']
export type DencyInstanceType = AnyDency['instanceType']

export type DencyId<_TType> = { name: string, __type: _TType }

const sola = new Sola({ tag: 'vyke:dency' })

class DencyContainer {
	ids = new Set<string>()
	dencies = new WeakMap<DencyId<any>, AnyDency>()
	constructor() {}

	create<TType>(name: string): DencyId<TType> {
		const { ids } = this
		if (ids.has(name)) {
			sola.warn(`"${name}" name is already being use, this is only need for debugging purposes`)
		}

		ids.add(name)

		return { name } as DencyId<TType>
	}

	bind<TType, TDeps, TFactory extends DencyFactory<TType, TDeps>>(
		id: DencyId<TType>,
		factory: TFactory,
		deps: TDeps,
		instanceType: DencyInstanceType = 'singleton',
	) {
		const { dencies } = this

		if (dencies.has(id)) {
			sola.debug(`Replacing "${id.name}" dency with a new one`)
		}

		const extra = instanceType === 'scoped' ? { instanceType, scopes: new Map() } : { instanceType }

		dencies.set(id, {
			type: 'factory',
			deps: deps as AnyDeps,
			factory: factory as AnyDency['factory'],
			...extra,
		})
	}

	bindClass<TType, TDeps, TClass extends DencyClass<TType, TDeps>>(
		id: DencyId<TType>,
		Class: TClass,
		deps: TDeps,
		instanceType: DencyInstanceType = 'singleton',
	) {
		this.bind(id,
			(...args: TupleIdToDencies<TDeps>) => {
				return new Class(...args)
			},
			deps,
			instanceType,
		)
	}

	#getDency<TType>(id: DencyId<TType>) {
		const { dencies } = this

		const dency = dencies.get(id)
		if (dency) {
			return dency
		}

		throw new Error(`"${id.name}" dency not found`)
	}

	use<TType>(id: DencyId<TType>): TType {
		const dency = this.#getDency(id)
		if (dency.type === 'factory') {
			const { factory } = dency
			const deps = dency.deps.map(
				(id: DencyId<unknown>) => this.use(id),
			) as Array<any>
			if (dency.instanceType === 'singleton') {
				const instance = dency.instance || factory(...deps)

				dency.instance = instance
				return instance
			}

			if (dency.instanceType === 'transient') {
				const instance = factory(...deps)

				return instance
			}
		}

		throw new Error('not implemented')
	}
}

export const dency = new DencyContainer()

export const createDencyId = dency.create.bind(dency)

export const bindDencyClass = dency.bindClass.bind(dency)
export const bindDency = dency.bind.bind(dency)

export const useDency = dency.use.bind(dency)
