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