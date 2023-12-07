import { Sola } from '@vyke/sola'

export type AnyDeps = Array<DencyId<any>>

export type ExtractType<T> = T extends { __type: infer TType } ? TType : never
export type TupleIdToDencies<T> =
	T extends readonly [infer THead, ...infer TTail]
		? [ExtractType<THead>, ...TupleIdToDencies<TTail>]
		: T extends readonly [infer TLast]
			? [ExtractType<TLast>]
			: []

type Class<T, Arguments extends Array<any> = Array<any>> = {
	prototype: Pick<T, keyof T>
	new(...arguments_: Arguments): T
}

export type DencyClass<TType, TDeps> = Class<TType, TupleIdToDencies<TDeps>>

export type SpecificDency<TType> = ({
	instanceType: 'singleton'
	instance?: TType
} | {
	instanceType: 'transient'
} | {
	instanceType: 'scoped'
	scopes: Map<string, TType>
})
export type Dency<TType, TDeps> = {
	type: 'class'
	deps: TDeps
	Class: DencyClass<TType, TDeps>
} & SpecificDency<TType>

type AnyClass = {
	prototype: any
	new(...arguments_: Array<any>): any
}

type AnyDency = SpecificDency<any> & {
	type: 'class'
	deps: AnyDeps
	Class: AnyClass
}

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

	bindClass<TType, TDeps, TClass extends DencyClass<TType, TDeps>>(
		id: DencyId<TType>,
		Class: TClass,
		deps: TDeps,
		instanceType: DencyInstanceType = 'singleton',
	) {
		const { dencies } = this

		if (dencies.has(id)) {
			sola.debug(`Replacing "${id.name}" dency with a new one`)
		}

		const extra = instanceType === 'scoped' ? { instanceType, scopes: new Map() } : { instanceType }

		dencies.set(id, {
			Class,
			deps: deps as AnyDeps,
			type: 'class',
			...extra,
		})
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
		if (dency.type === 'class') {
			const deps = dency.deps.map(
				(id: DencyId<unknown>) => this.use(id),
			) as Array<any>

			if (dency.instanceType === 'singleton') {
				const instance = dency.instance || new dency.Class(...deps)

				dency.instance = instance
				return instance
			}

			if (dency.instanceType === 'transient') {
				const instance = new dency.Class(...deps)

				return instance
			}
		}

		throw new Error('not implemented')
	}
}

export const dency = new DencyContainer()

export const createDencyId = dency.create.bind(dency)

export const bindDencyClass = dency.bindClass.bind(dency)

export const useDency = dency.use.bind(dency)
