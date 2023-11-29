import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
	entries: [
		{
			builder: 'mkdist',
			input: './src',
			pattern: '**/!(*test).ts',
			outDir: './dist',
		},
	],
	declaration: true,
})
