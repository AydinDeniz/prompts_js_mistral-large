
// Function to parse raw JSON from a request body and convert it into a JavaScript object
function parseJSONRequestBody(rawJSON) {
  try {
    // Parse the raw JSON string
    const parsedObject = JSON.parse(rawJSON);

    // Validate the parsed object to ensure it is a valid JSON structure
    if (typeof parsedObject !== 'object' || parsedObject === null) {
      throw new Error('Invalid JSON format');
    }

    // Recursively validate nested structures
    function validateNestedStructure(obj) {
      if (typeof obj !== 'object' || obj === null) {
        throw new Error('Invalid nested structure');
      }
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          validateNestedStructure(obj[key]);
        }
      }
    }

    validateNestedStructure(parsedObject);

    return parsedObject;
  } catch (error) {
    console.error('Error parsing JSON:', error.message);
    return null;
  }
}

// Example usage
const rawJSON = '{"name": "John", "age": 30, "address": {"street": "123 Main St", "city": "Anytown"}, "details": {"education": {"degree": "Bachelor", "university": "XYZ University"}, "job": {"title": "Engineer", "company": "ABC Corp"}}}';
const parsedObject = parseJSONRequestBody(rawJSON);

if (parsedObject) {
  console.log('Parsed JSON Object:', parsedObject);
} else {
  console.log('Failed to parse JSON.');
}