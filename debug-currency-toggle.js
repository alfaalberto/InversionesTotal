// Debug script para probar el toggle de moneda
console.log('=== DEBUGGING CURRENCY TOGGLE ===');

// Simular datos de prueba
const testData = {
  costBasis: 1000,
  currentValue: 1200,
  pnl: 200,
  originalCurrency: 'USD'
};

const exchangeRate = 17.5;

// Función de prueba para FormatMonetaryValue
function testFormatMonetaryValue(value, displayCurrency, exchangeRate) {
  let displayValue = value;
  let tooltip = '';
  
  if (displayCurrency === 'MXN' && exchangeRate) {
    displayValue = value * exchangeRate;
    tooltip = `Valor en USD: ${value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}\nConvertido a MXN: ${displayValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}\nTipo de cambio: ${exchangeRate.toFixed(4)}`;
  } else {
    tooltip = `Valor en USD: ${value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
  }
  
  return {
    displayValue,
    tooltip,
    formattedValue: displayValue.toLocaleString(displayCurrency === 'USD' ? 'en-US' : 'es-MX', { style: 'currency', currency: displayCurrency })
  };
}

// Probar conversiones
console.log('--- Prueba USD ---');
const usdResult = testFormatMonetaryValue(testData.currentValue, 'USD', exchangeRate);
console.log('USD Result:', usdResult);

console.log('--- Prueba MXN ---');
const mxnResult = testFormatMonetaryValue(testData.currentValue, 'MXN', exchangeRate);
console.log('MXN Result:', mxnResult);

// Verificar que los valores cambien
console.log('--- Verificación ---');
console.log('USD formatted:', usdResult.formattedValue);
console.log('MXN formatted:', mxnResult.formattedValue);
console.log('¿Son diferentes?', usdResult.formattedValue !== mxnResult.formattedValue);

console.log('=== FIN DEBUG ===');
