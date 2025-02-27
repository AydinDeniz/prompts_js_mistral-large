// Utility Function to Deeply Merge Two Complex JSON Objects

function deepMerge(target, source) {
  const isObject = (obj) => obj && typeof obj === 'object';

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach((key) => {
    if (isObject(source[key])) {
      if (!target[key]) {
        Object.assign(target, { [key]: source[key] });
      } else {
        target[key] = deepMerge(target[key], source[key]);
      }
    } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
      target[key] = [...new Set([...target[key], ...source[key]])];
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  });

  return target;
}

// Example usage
const obj1 = {
  a: 1,
  b: {
    c: 2,
    d: [1, 2, 3],
  },
  e: [4, 5, 6],
};

const obj2 = {
  b: {
    c: 3,
    e: 4,
  },
  e: [7, 8, 9],
  f: 10,
};

const mergedObj = deepMerge(obj1, obj2);
console.log(mergedObj);