import type { KnipConfig } from 'knip'

const config: KnipConfig = {
	entry: [
		'src/index.ts',
	],
	project: [
		'**/*.{js,ts}',
	],
	ignore: [
		'build.config.ts',
		'**/*.test.ts',
	],
}

export default config
