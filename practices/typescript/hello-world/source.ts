function add(a: number, b: number): number {
  return a + b;
}

function main(): void {
  console.log("Hello, world!");

  const name: string = "Alex";
  const age: number = 20;
  const isLearning: boolean = true;

  console.log("Name:", name);
  console.log("Age:", age);
  console.log("Learning TypeScript:", isLearning);

  // Use let when a variable needs to change; const prevents reassignment.
  let lessonsCompleted: number = 0;
  lessonsCompleted = add(lessonsCompleted, 1);
  console.log("Lessons completed:", lessonsCompleted);

  // TypeScript can also infer a type from the assigned value.
  const greeting = "Keep practicing!";
  const sum = add(2, 3);
  console.log("2 + 3 =", sum);
  console.log(greeting);
}

main();
