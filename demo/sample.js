function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero is not allowed');
  }
  return a / b;
}

function modulus(a, b) {
  return a % b;
}

class Parent {
  constructor(name) {
    this.name = name;
  }

  greet() {
    return `Hello, ${this.name}!`;
  }
}

class Child extends Parent {
  constructor(name, age) {
    super(name);
    this.age = age;
  }

  introduce() {
    return `Hi, I'm ${this.name} and I'm ${this.age} years old.`;
  }
}

function main() {
  const a = 10;
  const b = 5;

  console.log(`Adding ${a} and ${b}:`, add(a, b));
  console.log(`Subtracting ${b} from ${a}:`, subtract(a, b));
  console.log(`Multiplying ${a} and ${b}:`, multiply(a, b));
  console.log(`Dividing ${a} by ${b}:`, divide(a, b));
  console.log(`Modulus of ${a} and ${b}:`, modulus(a, b));

  const parent = new Parent('Alice');
  console.log(parent.greet());

  const child = new Child('Bob', 10);
  console.log(child.introduce());
}

main();
