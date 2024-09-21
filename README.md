<div align="center">
	<h1>
		@vyke/dency
	</h1>
</div>

Simple and lightweight dependency injection for vanilla JavaScript and TypeScript

# Features
- No decorators, no annotations, no classes
- Simple API
- Scoped, singleton and transient dependencies
- TypeScript support
- No dependencies
- Tiny size

## Installation
```sh
npm i @vyke/dency
```

## Examples
```ts
import { createScope, defineDep, TRANSIENT_SCOPE } from '@vyke/dency'

const getTheme = defineDep(() => {
	let color = 'light'
	return {
		getColor: () => color,
		toogle: () => {
			color = color === 'light' ? 'dark' : 'light'
		}
	}
})

const createThemeToggle = defineDep((theme = getTheme()) => {
	const theme = scope.get(theme)
	return {
		toogle: () => theme.toogle()
	}
}, { scopeTye: TRANSIENT_SCOPE })

const toggle1 = createThemeToggle()
const toggle2 = createThemeToggle()
```

## API
### createScope
Create a new scope.

```ts
import { createScope, defineDep } from '@vyke/dency'

const scope = createScope()

const createDep = defineDep()

const myDep = createDeps({ scope })
```

### rootScope
The root scope. it is used by default if no scope is provided.

### SINGLETON_SCOPE
Singleton scope type.

### TRANSIENT_SCOPE
Transient scope type.

### SCOPED_SCOPE
Scoped scope type.

### SCOPE_TYPE
Scope types.

### defineDep
Define a dependency.

```ts
import { defineDep } from '@vyke/dency'

const createDep = defineDep(() => 'Hello, World!')

const myDep = createDep()

console.log(myDep) // Hello, World!
```

## Others vyke projects
- [Flowmodoro app by vyke](https://github.com/albizures/vyke-flowmodoro)
- [@vyke/results](https://github.com/albizures/vyke-results)
- [@vyke/val](https://github.com/albizures/vyke-val)
- [@vyke/tsdocs](https://github.com/albizures/vyke-tsdocs)
