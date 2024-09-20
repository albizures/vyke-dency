import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createScope, defineDency, rootScope, SCOPED_SCOPE, TRANSIENT_SCOPE } from './dency'

beforeEach(() => {
	rootScope.reset()
})

describe('transient dependencies', () => {
	it('should support creating transient dependencies', () => {
		const start = vi.fn()
		const fuelLevel = vi.fn(() => 100)
		const createEngine = defineDency(() => {
			return {
				start,
				fuelLevel,
			}
		}, {
			scopeType: TRANSIENT_SCOPE,
		})

		const engines = new Set()

		const createCar = defineDency((
			engine = createEngine(),
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

		const car1 = createCar()
		const car2 = createCar()

		car1.start()
		car2.start()

		expect(car1).not.toBe(car2)
		expect(start).toHaveBeenCalled()
		expect(fuelLevel).toHaveBeenCalled()
		expect(engines.size).toBe(2)
	})

	it('should ignore scope when creating transient dependencies', () => {
		const scope = createScope()
		const createTransient = defineDency(() => {
			return {}
		}, {
			scopeType: TRANSIENT_SCOPE,
		})

		const instance1 = createTransient({ scope })
		const instance2 = createTransient({ scope })

		expect(instance1).not.toBe(instance2)

		expect(scope.instances.size).toBe(0)

		// transient dependencies should not be stored in the scope
		// so each instance can be garbage collected once they are no longer needed
		expect(rootScope.instances.size).toBe(0)
	})

	it('should give scope context to scoped dependencies', () => {
		const scope = createScope()

		const creator = vi.fn(() => ({}))

		const createScoped = defineDency(creator, {
			scopeType: SCOPED_SCOPE,
		})

		const createTransient = defineDency((_scoped = createScoped()) => {
			return {}
		}, {
			scopeType: TRANSIENT_SCOPE,
		})

		const instance1 = createTransient({ scope })
		const instance2 = createTransient({ scope })

		expect(instance1).not.toBe(instance2)

		expect(scope.instances.size).toBe(1)
		expect(scope.instances.has(creator)).toBe(true)

		expect(rootScope.instances.size).toBe(0)
	})

	it('should support props', () => {
		type Props = {
			name: string
		}
		const createCar = defineDency((props: Props) => {
			return {
				start: () => {
					return `starting ${props.name}`
				},
			}
		}, {
			scopeType: TRANSIENT_SCOPE,
		})

		const car1 = createCar({ props: { name: 'car1' } })
		const car2 = createCar({ props: { name: 'car2' } })

		expect(car1.start()).toBe('starting car1')
		expect(car2.start()).toBe('starting car2')
	})
})

describe('singleton dependencies', () => {
	it('should support creating singleton dependencies', () => {
		const getXModel = defineDency(() => {
			return {
				name: 'model x',
			}
		})

		const models = new Set()

		const createXCar = defineDency((
			model = getXModel(),
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

		const car1 = createXCar()
		const car2 = createXCar()

		car1.start()
		car2.start()

		expect(car1).not.toBe(car2)
		expect(models.size).toBe(1)
	})

	it('should ignore scope when creating singleton dependencies', () => {
		const scope = createScope()
		const createSingleton = defineDency(() => {
			return {}
		})

		const instance1 = createSingleton({ scope })
		const instance2 = createSingleton({ scope })

		expect(instance1).toBe(instance2)

		expect(scope.instances.size).toBe(0)

		expect(rootScope.instances.size).toBe(1)
	})

	it('should give scope context to scoped dependencies', () => {
		const scope = createScope()

		const creator = vi.fn(() => ({}))

		const createScoped = defineDency(creator, {
			scopeType: SCOPED_SCOPE,
		})

		const createSingleton = defineDency((_scoped = createScoped()) => {
			return {}
		})

		const instance1 = createSingleton({ scope })
		const instance2 = createSingleton({ scope })

		expect(instance1).toBe(instance2)

		expect(scope.instances.size).toBe(1)
		expect(scope.instances.has(creator)).toBe(true)

		expect(rootScope.instances.size).toBe(1)
	})

	it('should support props', () => {
		type Props = {
			name: string
		}
		const createCar = defineDency((props: Props) => {
			return {
				start: () => {
					return `starting ${props.name}`
				},
			}
		})

		const car1 = createCar({ props: { name: 'car1' } })
		// car2 should use the same instance as car1, so the props should be ignored
		const car2 = createCar({ props: { name: 'car2' } })

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
		const createEngine = defineDency(() => {
			return {
				start,
				fuelLevel,
			}
		}, {
			scopeType: SCOPED_SCOPE,
		})

		const engines = new Set()

		const createCar = defineDency((
			engine = createEngine(),
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

		const car1 = createCar({ scope: scope2000 })
		const car2 = createCar({ scope: scope2001 })
		const car3 = createCar({ scope: scope2001 })

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

		const creator1 = vi.fn(() => ({}))

		const createScoped1 = defineDency(creator1, {
			scopeType: SCOPED_SCOPE,
		})

		const creator2 = vi.fn((_scoped1 = createScoped1()) => ({}))

		const createScoped2 = defineDency(creator2, {
			scopeType: SCOPED_SCOPE,
		})

		createScoped2({ scope })

		expect(scope.instances.size).toBe(2)
		expect(scope.instances.has(creator1)).toBe(true)
		expect(scope.instances.has(creator2)).toBe(true)
	})

	it('should use the given scope', () => {
		const scope1 = createScope()
		const scope2 = createScope()

		const creator1 = vi.fn(() => ({}))

		const createScoped1 = defineDency(creator1, {
			scopeType: SCOPED_SCOPE,
		})

		const creator2 = vi.fn((_scoped1 = createScoped1({ scope: scope2 })) => ({}))

		const createScoped2 = defineDency(creator2, {
			scopeType: SCOPED_SCOPE,
		})

		createScoped2({ scope: scope1 })

		expect(scope1.instances.size).toBe(1)
		expect(scope1.instances.has(creator1)).toBe(false)
		expect(scope1.instances.has(creator2)).toBe(true)

		expect(scope2.instances.size).toBe(1)
		expect(scope2.instances.has(creator1)).toBe(true)
		expect(scope2.instances.has(creator2)).toBe(false)
	})

	it('should support props', () => {
		type Props = {
			name: string
		}
		const createCar = defineDency((props: Props) => {
			return {
				start: () => {
					return `starting ${props.name}`
				},
			}
		}, {
			scopeType: SCOPED_SCOPE,
		})

		const scope = createScope()

		const car1 = createCar({ scope, props: { name: 'car1' } })
		const car2 = createCar({ scope, props: { name: 'car2' } })

		expect(car1.start()).toBe('starting car1')
		// car2 should use the same instance as car1, so the props should be ignored
		expect(car2.start()).toBe('starting car1')
	})
})
