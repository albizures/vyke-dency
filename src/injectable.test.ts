import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createScope, defineInjectable, inject, rootScope, SCOPED_SCOPE, TRANSIENT_SCOPE, use } from './injectable'

beforeEach(() => {
	rootScope.reset()
})

describe('transient dependencies', () => {
	it('should support creating transient dependencies', () => {
		const start = vi.fn()
		const fuelLevel = vi.fn(() => 100)
		const createEngine = defineInjectable(() => {
			return {
				start,
				fuelLevel,
			}
		}, {
			scopeType: TRANSIENT_SCOPE,
		})

		const engines = new Set()

		const createCar = defineInjectable((
			engine = inject(createEngine),
		) => {
			engines.add(engine)
			return {
				start: () => {
					if (engine.fuelLevel() > 0) {
						engine.start()
					}
				},
			}
		}, {
			scopeType: TRANSIENT_SCOPE,
		})

		const car1 = inject(createCar)
		const car2 = inject(createCar)

		car1.start()
		car2.start()

		expect(car1).not.toBe(car2)
		expect(start).toHaveBeenCalled()
		expect(fuelLevel).toHaveBeenCalled()
		expect(engines.size).toBe(2)
	})

	it('should ignore scope when creating transient dependencies', () => {
		const scope = createScope()
		const createTransient = defineInjectable(() => {
			return {}
		}, {
			scopeType: TRANSIENT_SCOPE,
		})

		const instance1 = scope.inject(createTransient)
		const instance2 = scope.inject(createTransient)

		expect(instance1).not.toBe(instance2)

		expect(scope.instances.size).toBe(0)

		// transient dependencies should not be stored in the scope
		// so each instance can be garbage collected once they are no longer needed
		expect(rootScope.instances.size).toBe(0)
	})

	it('should give scope context to scoped dependencies', () => {
		const scope = createScope()

		const createScoped = defineInjectable(() => ({}), {
			scopeType: SCOPED_SCOPE,
		})

		const createTransient = defineInjectable((_scoped = inject(createScoped)) => {
			return {}
		}, {
			scopeType: TRANSIENT_SCOPE,
		})

		const instance1 = scope.inject(createTransient)
		const instance2 = scope.inject(createTransient)

		expect(instance1).not.toBe(instance2)

		expect(scope.instances.size).toBe(1)
		expect(scope.instances.has(createScoped)).toBe(true)

		expect(rootScope.instances.size).toBe(0)
	})

	it('should support props', () => {
		const createBrand = defineInjectable(() => {
			return 'brand'
		})
		type Props = {
			name: string
		}
		const createCar = defineInjectable((props: Props, brand = inject(createBrand)) => {
			return {
				start: () => {
					return `starting ${props.name}`
				},
				brand,
			}
		}, {
			scopeType: TRANSIENT_SCOPE,
		})

		const car1 = inject(createCar, { name: 'car1' })
		const car2 = inject(createCar, { name: 'car2' })

		expect(car1.start()).toBe('starting car1')
		expect(car2.start()).toBe('starting car2')
	})
})

describe('singleton dependencies', () => {
	it('should support creating singleton dependencies', () => {
		const getXModel = defineInjectable(() => {
			return {
				name: 'model x',
			}
		})

		const models = new Set()

		const createXCar = defineInjectable((
			model = inject(getXModel),
		) => {
			models.add(model)
			return {
				start: () => {
					return `starting ${model.name}`
				},
			}
		}, {
			scopeType: TRANSIENT_SCOPE,
		})

		const car1 = inject(createXCar)
		const car2 = inject(createXCar)

		car1.start()
		car2.start()

		expect(car1).not.toBe(car2)
		expect(models.size).toBe(1)
	})

	it('should ignore scope when creating singleton dependencies', () => {
		const scope = createScope()
		const createSingleton = defineInjectable(() => {
			return {}
		})

		const instance1 = scope.inject(createSingleton)
		const instance2 = scope.inject(createSingleton)

		expect(instance1).toBe(instance2)

		expect(scope.instances.size).toBe(0)

		expect(rootScope.instances.size).toBe(1)
	})

	it('should give scope context to scoped dependencies', () => {
		const scope = createScope()

		const createScoped = defineInjectable(() => ({}), {
			scopeType: SCOPED_SCOPE,
		})

		const createSingleton = defineInjectable((_scoped = inject(createScoped)) => {
			return {}
		})

		const instance1 = scope.inject(createSingleton)
		const instance2 = scope.inject(createSingleton)

		expect(instance1).toBe(instance2)

		expect(scope.instances.size).toBe(1)
		expect(scope.instances.has(createScoped)).toBe(true)

		expect(rootScope.instances.size).toBe(1)
	})

	it('should support props', () => {
		type Props = {
			name: string
		}
		const createCar = defineInjectable((props: Props) => {
			return {
				start: () => {
					return `starting ${props.name}`
				},
			}
		})

		const car1 = inject(createCar, { name: 'car1' })
		// car2 should use the same instance as car1, so the props should be ignored
		const car2 = inject(createCar, { name: 'car2' })

		expect(car1.start()).toBe('starting car1')
		expect(car2.start()).toBe('starting car1')
	})
})

describe('scoped dependencies', () => {
	it('support scoped dependencies', () => {
		const start = vi.fn()

		const scope2000 = createScope()
		const scope2001 = createScope()

		const fuelLevel = vi.fn(() => 100)
		const createEngine = defineInjectable(() => {
			return {
				start,
				fuelLevel,
			}
		}, {
			scopeType: SCOPED_SCOPE,
		})

		const engines = new Set()

		const createCar = defineInjectable((
			engine = inject(createEngine),
		) => {
			engines.add(engine)
			return {
				start: () => {
					if (engine.fuelLevel() > 0) {
						engine.start()
					}
				},
			}
		}, {
			scopeType: TRANSIENT_SCOPE,
		})

		const car1 = scope2000.inject(createCar)
		const car2 = scope2001.inject(createCar)
		const car3 = scope2001.inject(createCar)

		car1.start()
		car2.start()
		car3.start()

		expect(car1).not.toBe(car2)
		expect(car2).not.toBe(car3)
		expect(car1).not.toBe(car3)

		expect(start).toHaveBeenCalledTimes(3)
		expect(fuelLevel).toHaveBeenCalledTimes(3)

		expect(engines.size).toBe(2)

		expect(scope2000.instances.size).toBe(1)
		expect(scope2001.instances.size).toBe(1)
	})

	it('should give scope context to other scoped dependencies', () => {
		const scope = createScope()

		const createScoped1 = defineInjectable(() => ({}), {
			scopeType: SCOPED_SCOPE,
		})

		const createScoped2 = defineInjectable((_scoped1 = inject(createScoped1)) => ({}), {
			scopeType: SCOPED_SCOPE,
		})

		scope.inject(createScoped2)

		expect(scope.instances.size).toBe(2)
		expect(scope.instances.has(createScoped1)).toBe(true)
		expect(scope.instances.has(createScoped2)).toBe(true)
	})

	it('should use the given scope', () => {
		const scope1 = createScope()
		const scope2 = createScope()

		const createScoped1 = defineInjectable(() => ({}), {
			scopeType: SCOPED_SCOPE,
		})

		const createScoped2 = defineInjectable((_scoped1 = scope2.inject(createScoped1)) => ({}), {
			scopeType: SCOPED_SCOPE,
		})

		scope1.inject(createScoped2)

		expect(scope1.instances.size).toBe(1)
		expect(scope1.instances.has(createScoped1)).toBe(false)
		expect(scope1.instances.has(createScoped2)).toBe(true)

		expect(scope2.instances.size).toBe(1)
		expect(scope2.instances.has(createScoped1)).toBe(true)
		expect(scope2.instances.has(createScoped2)).toBe(false)
	})

	it('should support props', () => {
		type Props = {
			name: string
		}
		const createCar = defineInjectable((props: Props) => {
			return {
				start: () => {
					return `starting ${props.name}`
				},
			}
		}, {
			scopeType: SCOPED_SCOPE,
		})

		const scope = createScope()

		const car1 = scope.inject(createCar, { name: 'car1' })
		const car2 = scope.inject(createCar, { name: 'car2' })

		expect(car1.start()).toBe('starting car1')
		// car2 should use the same instance as car1, so the props should be ignored
		expect(car2.start()).toBe('starting car1')
	})
})

describe('dependencies', () => {
	it('should register only direct dependencies', () => {
		const dep1 = defineInjectable(() => {
			return {}
		})
		const dep2 = defineInjectable(() => {
			return {}
		})

		const dep3 = defineInjectable((_dep1 = inject(dep1), _dep2 = inject(dep2)) => {
			return {}
		})

		const main = defineInjectable((_dep3 = inject(dep3)) => {
			return {}
		})

		inject(main)

		expect(dep1.deps.size).toBe(0)
		expect(dep2.deps.size).toBe(0)

		expect(dep3.deps.size).toBe(2)
		expect(dep3.deps).includes(dep1)
		expect(dep3.deps).includes(dep2)

		expect(main.deps.size).toBe(1)
		expect(main.deps).includes(dep3)
	})
})
