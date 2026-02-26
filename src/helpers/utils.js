//Function to format pricing to USD
export function formatPrice(amount, currency = 'USD') {
  if (amount === undefined || amount === null || amount === 'N/A') return 'N/A';
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (Number.isNaN(num)) return 'N/A';

  switch(currency.toUpperCase()) {
    case 'USD':
      return `$${num.toFixed(2)}`;
    // future: add more currencies if needed
    default:
      return `${num.toFixed(2)} ${currency}`;
  }
}