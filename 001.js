function jsonToCsv(jsonData) {
    const flattenObject = (obj, prefix = '', result = {}) => {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    flattenObject(value, newKey, result);
                } else {
                    result[newKey] = value;
                }
            }
        }
        return result;
    };

    const getHeaders = (data) => {
        const headers = new Set();
        data.forEach(item => {
            const flattened = flattenObject(item);
            Object.keys(flattened).forEach(header => headers.add(header));
        });
        return Array.from(headers);
    };

    const data = Array.isArray(jsonData) ? jsonData : [jsonData];
    const headers = getHeaders(data);
    const csvRows = data.map(item => {
        const flattened = flattenObject(item);
        return headers.map(header => flattened[header] || '');
    });

    const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    return csvContent;
}

// Example usage:
const jsonData = [
    {
        name: "John",
        address: {
            city: "New York",
            zipcode: "10001"
        },
        contact: {
            email: "john@example.com",
            phone: "123-456-7890"
        }
    },
    {
        name: "Jane",
        address: {
            city: "Los Angeles",
            zipcode: "90001"
        },
        contact: {
            email: "jane@example.com"
        }
    }
];

console.log(jsonToCsv(jsonData));