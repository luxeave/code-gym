// Generics in TypeScript — reconstructed source for this practice.
// See ../../notes/generics.md for the accompanying explanation.

// T is inferred from the array; undefined accounts for an empty array.
function first<T>(items: T[]): T | undefined {
  return items[0];
}

// The box holds T, while each map call infers its own result type U.
type Box<T> = {
  value: T;
  map<U>(fn: (value: T) => U): Box<U>;
};

// Reusing the factory lets the mapped box support further map calls.
function box<T>(value: T): Box<T> {
  return {
    value,
    map: (fn) => box(fn(value)),
  };
}

// The constraint permits length comparisons while preserving the input type.
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}

const a = first([1, 2, 3]); // number | undefined
const b = first(["x", "y"]); // string | undefined
const len = box("hello").map((s) => s.length); // Box<number>
const l1 = longest("ab", "abc"); // "abc"
const l2 = longest([1], [1, 2, 3]); // [1, 2, 3]
console.log(a, b, len.value, l1, l2);

// longest(1, 2); // Type error: numbers have no length property.
