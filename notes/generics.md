# Generics in TypeScript

A generic is a type parameter. Instead of fixing a type up front, the caller supplies it, and the function or type stays type-safe for whatever it gets.

## Why not `any`

```ts
// Returns the first element, but the type is lost: callers get `any`.
function firstAny(items: any[]): any {
  return items[0];
}

const n = firstAny([1, 2, 3]); // n: any, no checking downstream
```

## A generic function

```ts
// `T` is a type parameter. TypeScript infers it from the argument.
function first<T>(items: T[]): T | undefined {
  // Return `undefined` on empty input instead of lying about the type.
  return items[0];
}

const a = first([1, 2, 3]);       // a: number | undefined
const b = first(["x", "y"]);      // b: string | undefined
```

## A generic type

```ts
// A wrapper that works for any payload type.
type Box<T> = {
  value: T;
  // A method that keeps the type parameter alive.
  map<U>(fn: (value: T) => U): Box<U>;
};

// Factory: builds a Box and implements `map` by calling the factory again.
function box<T>(value: T): Box<T> {
  return {
    value,
    map: (fn) => box(fn(value)),
  };
}

const len = box("hello").map((s) => s.length); // Box<number>
```

## Constraining a type parameter

```ts
// `extends` limits what T can be: anything with a `length` property.
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

longest("ab", "abc");      // "abc"
longest([1], [1, 2, 3]);   // [1, 2, 3]
// longest(1, 2);          // error: number has no `length`
```
