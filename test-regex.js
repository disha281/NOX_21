const ocrService = require('./server/services/ocrService');

console.log('Testing escapeRegex function...');

try {
  const testString = 'test[special]chars';
  const escaped = ocrService.escapeRegex(testString);
  console.log('Input:', testString);
  console.log('Escaped:', escaped);
  
  // Test if it creates a valid regex
  const regex = new RegExp(escaped);
  console.log('Regex created successfully:', regex.toString());
  
} catch (error) {
  console.error('Error:', error.message);
}