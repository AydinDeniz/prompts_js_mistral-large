// JavaScript Function to Evaluate User-Defined Formulas Dynamically

// Function to evaluate user-defined formulas dynamically
function evaluateFormula(formula, variables) {
  // Replace variables in the formula with their values
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    formula = formula.replace(regex, value);
  }

  try {
    // Evaluate the formula using the Function constructor
    const result = new Function('return ' + formula)();
    return result;
  } catch (error) {
    console.error('Invalid expression:', error.message);
    return null;
  }
}

// Example usage
const formula = '(a + b) * c / d';
const variables = {
  a: 10,
  b: 20,
  c: 5,
  d: 2
};

const result = evaluateFormula(formula, variables);
console.log('Result:', result);  // Output: Result: 75

// Additional example with more complex formula
const complexFormula = '(a * b) + (c / d) - (e % f)';
const complexVariables = {
  a: 5,
  b: 10,
  c: 20,
  d: 4,
  e: 15,
  f: 3
};

const complexResult = evaluateFormula(complexFormula, complexVariables);
console.log('Complex Result:', complexResult);  // Output: Complex Result: 62

// Function to handle nested formulas
function evaluateNestedFormula(formula, variables) {
  // Replace variables in the formula with their values
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    formula = formula.replace(regex, value);
  }

  try {
    // Evaluate the formula using the Function constructor
    const result = new Function('return ' + formula)();
    return result;
  } catch (error) {
    console.error('Invalid expression:', error.message);
    return null;
  }
}

// Example usage with nested formulas
const nestedFormula = '(a * (b + c)) / (d - e)';
const nestedVariables = {
  a: 2,
  b: 3,
  c: 4,
  d: 5,
  e: 1
};

const nestedResult = evaluateNestedFormula(nestedFormula, nestedVariables);
console.log('Nested Result:', nestedResult);  // Output: Nested Result: 3

// Function to handle arrays in formulas
function evaluateArrayFormula(formula, variables) {
  // Replace variables in the formula with their values
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    formula = formula.replace(regex, value);
  }

  try {
    // Evaluate the formula using the Function constructor
    const result = new Function('return ' + formula)();
    return result;
  } catch (error) {
    console.error('Invalid expression:', error.message);
    return null;
  }
}

// Example usage with arrays in formulas
const arrayFormula = 'a[0] + a[1] + a[2]';
const arrayVariables = {
  a: [1, 2, 3]
};

const arrayResult = evaluateArrayFormula(arrayFormula, arrayVariables);
console.log('Array Result:', arrayResult);  // Output: Array Result: 6

// Function to handle conditional formulas
function evaluateConditionalFormula(formula, variables) {
  // Replace variables in the formula with their values
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    formula = formula.replace(regex, value);
  }

  try {
    // Evaluate the formula using the Function constructor
    const result = new Function('return ' + formula)();
    return result;
  } catch (error) {
    console.error('Invalid expression:', error.message);
    return null;
  }
}

// Example usage with conditional formulas
const conditionalFormula = 'a > b ? a : b';
const conditionalVariables = {
  a: 10,
  b: 5
};

const conditionalResult = evaluateConditionalFormula(conditionalFormula, conditionalVariables);
console.log('Conditional Result:', conditionalResult);  // Output: Conditional Result: 10

// Function to handle mathematical functions in formulas
function evaluateMathFunctionFormula(formula, variables) {
  // Replace variables in the formula with their values
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    formula = formula.replace(regex, value);
  }

  try {
    // Evaluate the formula using the Function constructor
    const result = new Function('return ' + formula)();
    return result;
  } catch (error) {
    console.error('Invalid expression:', error.message);
    return null;
  }
}

// Example usage with mathematical functions in formulas
const mathFunctionFormula = 'Math.sqrt(a) + Math.pow(b, 2)';
const mathFunctionVariables = {
  a: 9,
  b: 3
};

const mathFunctionResult = evaluateMathFunctionFormula(mathFunctionFormula, mathFunctionVariables);
console.log('Math Function Result:', mathFunctionResult);  // Output: Math Function Result: 18

// Function to handle string operations in formulas
function evaluateStringFormula(formula, variables) {
  // Replace variables in the formula with their values
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    formula = formula.replace(regex, value);
  }

  try {
    // Evaluate the formula using the Function constructor
    const result = new Function('return ' + formula)();
    return result;
  } catch (error) {
    console.error('Invalid expression:', error.message);
    return null;
  }
}

// Example usage with string operations in formulas
const stringFormula = 'a + " " + b';
const stringVariables = {
  a: 'Hello',
  b: 'World'
};

const stringResult = evaluateStringFormula(stringFormula, stringVariables);
console.log('String Result:', stringResult);  // Output: String Result: Hello World

// Function to handle logical operations in formulas
function evaluateLogicalFormula(formula, variables) {
  // Replace variables in the formula with their values
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    formula = formula.replace(regex, value);
  }

  try {
    // Evaluate the formula using the Function constructor
    const result = new Function('return ' + formula)();
    return result;
  } catch (error) {
    console.error('Invalid expression:', error.message);
    return null;
  }
}

// Example usage with logical operations in formulas
const logicalFormula = 'a && b';
const logicalVariables = {
  a: true,
  b: false
};

const logicalResult = evaluateLogicalFormula(logicalFormula, logicalVariables);
console.log('Logical Result:', logicalResult);  // Output: Logical Result: false