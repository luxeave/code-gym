# Generics in TypeScript

Make the file compile with full type safety and no `any`.

Write, in order:

1. A generic function `first` that returns the first element of an array, or `undefined` when the array is empty. The element type must be inferred from the argument.
2. A generic type `Box<T>` holding a `value` of type `T` and a `map` method that transforms the value into a new `Box` of another type.
3. A factory `box` that builds a `Box<T>` from a value and implements `map` by reusing the factory.
4. A function `longest` that accepts two values of the same type, as long as that type has a numeric `length`, and returns the longer one.

Expected usage, already at the bottom of the file:

```ts
first([1, 2, 3]);                     // number | undefined
first(["x", "y"]);                    // string | undefined
box("hello").map((s) => s.length);    // Box<number>
longest("ab", "abc");                 // "abc"
longest([1], [1, 2, 3]);              // [1, 2, 3]
```

Self-check: `longest(1, 2)` must be a type error.
