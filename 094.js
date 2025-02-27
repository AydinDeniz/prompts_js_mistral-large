// JavaScript Sanitization Library for Multi-Tenant Application

// Import necessary libraries
const sanitizeHtml = require('sanitize-html');
const { sanitizeSql } = require('sql-sanitize');
const validator = require('validator');

// Configuration for sanitize-html
const sanitizeHtmlConfig = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt']
  },
  selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href', 'src', 'cite']
};

// Function to sanitize HTML input
function sanitizeHtmlInput(input) {
  return sanitizeHtml(input, sanitizeHtmlConfig);
}

// Function to sanitize SQL input
function sanitizeSqlInput(input) {
  return sanitizeSql(input);
}

// Function to validate and sanitize general input
function validateAndSanitizeInput(input, rules) {
  if (rules.type === 'email') {
    if (!validator.isEmail(input)) {
      throw new Error('Invalid email address');
    }
  } else if (rules.type === 'url') {
    if (!validator.isURL(input)) {
      throw new Error('Invalid URL');
    }
  } else if (rules.type === 'number') {
    if (!validator.isNumeric(input)) {
      throw new Error('Invalid number');
    }
  }

  // Additional custom validation rules can be added here

  return input;
}

// Function to sanitize input based on context and tenant-specific rules
function sanitizeInput(input, context, tenantRules) {
  let sanitizedInput = input;

  if (context === 'html') {
    sanitizedInput = sanitizeHtmlInput(input);
  } else if (context === 'sql') {
    sanitizedInput = sanitizeSqlInput(input);
  } else {
    // Apply tenant-specific rules
    if (tenantRules && tenantRules.length > 0) {
      tenantRules.forEach(rule => {
        sanitizedInput = validateAndSanitizeInput(sanitizedInput, rule);
      });
    }
  }

  return sanitizedInput;
}

// Example usage
const tenantRules = [
  { type: 'email' },
  { type: 'url' },
  { type: 'number' }
];

const htmlInput = '<script>alert("XSS")</script>';
const sqlInput = 'DROP TABLE users;';
const emailInput = 'invalid-email';
const urlInput = 'invalid-url';
const numberInput = 'invalid-number';

console.log('Sanitized HTML Input:', sanitizeInput(htmlInput, 'html'));
console.log('Sanitized SQL Input:', sanitizeInput(sqlInput, 'sql'));
console.log('Sanitized Email Input:', sanitizeInput(emailInput, 'general', tenantRules));
console.log('Sanitized URL Input:', sanitizeInput(urlInput, 'general', tenantRules));
console.log('Sanitized Number Input:', sanitizeInput(numberInput, 'general', tenantRules));