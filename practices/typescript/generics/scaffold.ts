// Generics in TypeScript: fill in each TODO so the usage at the bottom type-checks.

// TODO-01: declare a generic function `first` that returns the first element or undefined



// TODO-02: declare a generic type `Box<T>` with a `value` and a `map` method



// TODO-03: write a factory `box` that builds a `Box<T>` and implements `map`



// TODO-04: declare `longest`, constrained so both arguments have a numeric `length`



// Usage: must compile without errors.
const a = first([1, 2, 3]);
const b = first(["x", "y"]);
const len = box("hello").map((s) => s.length);
const l1 = longest("ab", "abc");
const l2 = longest([1], [1, 2, 3]);
console.log(a, b, len.value, l1, l2);
