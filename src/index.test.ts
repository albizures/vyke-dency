import { expect, it, vi } from 'vitest'
import {
	bindDency,
	bindDencyClass,
	createDencyId,
	useDency,
} from '.'

it('should create a single instance', () => {
	type GameDency = {
		win: () => void
		lose: () => void
		play: () => void
		stop: () => void
	}

	const GameDency = createDencyId<GameDency>('game')
	const play = vi.fn()

	class Game implements GameDency {
		static deps = [] as const
		win = vi.fn()
		lose = vi.fn()
		play = play
		stop = vi.fn()
	}

	bindDencyClass(
		GameDency,
		Game,
		Game.deps,
	)

	type AppDency = {
		start: () => void
	}

	const AppDency = createDencyId<AppDency>('app')

	class App {
		static deps = [GameDency] as const
		constructor(private game: GameDency) {}

		start() {
			this.game.play()
		}
	}

	bindDencyClass(
		AppDency,
		App,
		App.deps,
	)
	const app = useDency(AppDency)

	app.start()

	expect(play).toHaveBeenCalledOnce()

	const app2 = useDency(AppDency)

	expect(app).toBe(app2)
})

it('should create a new instance each time one is requested', () => {
	type TransientDency = {
		win: () => void
		lose: () => void
		play: () => void
		stop: () => void
	}

	const TransientDency = createDencyId<TransientDency>('transient')

	class Transient implements TransientDency {
		static deps = [] as const
		win = vi.fn()
		lose = vi.fn()
		play = vi.fn()
		stop = vi.fn()
	}

	bindDencyClass(
		TransientDency,
		Transient,
		Transient.deps,
		'transient',
	)

	const first = useDency(TransientDency)
	const second = useDency(TransientDency)

	expect(first).not.toBe(second)
})

it('should create an instance from using factory', () => {
	type GameDency = {
		win: () => void
		lose: () => void
		play: () => void
		stop: () => void
	}

	const GameDency = createDencyId<GameDency>('game')
	const play = vi.fn()

	class Game implements GameDency {
		static deps = [] as const
		win = vi.fn()
		lose = vi.fn()
		play = play
		stop = vi.fn()
	}

	bindDencyClass(
		GameDency,
		Game,
		Game.deps,
	)

	type AppDency = {
		start: () => void
	}

	const AppDency = createDencyId<AppDency>('app')

	const createApp = vi.fn((game: GameDency) => {
		return {
			start() {
				game.play()
			},
		}
	})

	const deps = [GameDency] as const

	bindDency(
		AppDency,
		createApp,
		deps,
	)
	const app = useDency(AppDency)

	app.start()
})

it.todo('should create a new instance within different scopes')
