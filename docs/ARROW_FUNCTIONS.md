## Arrow functions

This code mainly uses arrow functions in most of the classes. Sometimes, it is necessary to override an arrow function in an inherited class, although you will notice that this is not possible.  
Due to the context of the `this` keyword, it is difficult to overwrite this variable.

Para solucionar este problema, tenemos dos opciones:

### 1. Using traditional functions, and overwriting them

```js
class Adder
{
	constructor (public a: number) { }

	add(b: number)
	{
		return this.a + b;
	}
}

class Child extends Adder
{
	override add(b: number)
	{
		console.log('Called add() from child');
		return super.add(b);
	}
}
```

### 2. Using copies of arrow functions

```js
class Adder
{
	constructor (public a: number) { }

	add = (b: number) => this.a + b; // add() is now an arrow function
}

class Child extends Adder
{
	// @ts-expect-error - overwriting an arrow function
	#superAdd = this.add;

	override add = (b: number) =>
	{
		console.log('Called add() from child');

		return this.superAdd(b);
		// return super.add(b); // ! this will not work!
	}
}
```

Reference: https://basarat.gitbook.io/typescript/future-javascript/arrow-functions#tip-arrow-functions-and-inheritance
