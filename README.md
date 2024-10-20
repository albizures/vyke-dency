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
import { defineInjectable, inject } from '@vyke/dency'

const getHello = defineInjectable(() => 'Hello')
const getWorld = defineInjectable(() => 'World')
const getHelloWorld = defineInjectable((hello = inject(getHello), world = inject(getWorld)) => `${hello}, ${world}!`)
// the three dependencies are singletons by default

const helloWorld = inject(getHelloWorld) // Hello, World!
```

### With Scopes

```ts
import { createScope, defineInjectable, inject } from '@vyke/dency'
const firstScope = createScope()
const secondScope = createScope()

const getTheme = defineInjectable(() => {
	let color = 'light'
	return { // the return value is the dependency and can be anything
		getColor: () => color,
		toogle: () => {
			color = color === 'light' ? 'dark' : 'light'
		}
	}
})

const createThemeToggle = defineDep((theme = inject(getTheme)) => {
	return {
		toogle: () => theme.toogle()
	}
}, { scopeTye: TRANSIENT_SCOPE })

// both toggles will have the same theme
// but they will be different instances
const toggle1 = firstScope.inject(createThemeToggle)
const toggle2 = secondScope.inject(createThemeToggle)
```

### With Props

```ts
import { createScope, defineDep, inject, SCOPED_SCOPE } from '@vyke/dency'

const getHello = defineDep((name: string) => `Hello, ${name}!`)

const hello = inject(getHello, 'John') // Hello, John!
```
## API
### rootScope
The root scope. It is used by default if no scope is provided.

### createScope
Create a new scope.

```ts
import { createScope, defineInjectable } from '@vyke/dency'

const scope = createScope()

const createDep = defineInjectable(() => 'foo', {
	scopeType: SCOPED_SCOPE
})

const myDep = scope.inject(createDep)
```

### SINGLETON_SCOPE
Singleton scope type.

### TRANSIENT_SCOPE
Transient scope type.

### SCOPED_SCOPE
Scoped scope type.

### SCOPE_TYPE
Scope types.

### defineInjectable
Defines an injectable and returns it.

```ts
import { defineInjectable, SINGLETON_SCOPE } from '@vyke/dency'

const createDep1 = defineInjectable(() => {
 return 'Hello, World!'
}, { scopeType: SINGLETON_SCOPE })
const createDep2 = defineInjectable(() => {
return 'Hello, World!'
}) // Default scope type is SINGLETON_SCOPE
```

### inject
Injects an injectable and returns the instance.

```ts
import { defineInjectable, inject, SINGLETON_SCOPE } from '@vyke/dency'
const createDep = defineInjectable(() => {
return 'Hello, World'
}, { scopeType: SINGLETON_SCOPE })
const dep = inject(createDep) // can be used anywhere

console.log(dep) // Hello, World

// but usually, it is used inside another injectable
const createDep1 = defineInjectable((dep = inject(createDep)) => {
	return `${dep}!`
})

console.log(inject(createDep1)) // Hello, World!
```

### use
Returns the instance of an injectable if it exists.

```ts
import { defineInjectable, SINGLETON_SCOPE, use } from '@vyke/dency'
const createDep = defineInjectable(() => {
return 'Hello, World'
})

const dep = use(createDep) // probably undefined
```

## Others vyke projects
- [Flowmodoro app by vyke](https://github.com/albizures/vyke-flowmodoro)
- [@vyke/results](https://github.com/albizures/vyke-results)
- [@vyke/val](https://github.com/albizures/vyke-val)
- [@vyke/tsdocs](https://github.com/albizures/vyke-tsdocs)
