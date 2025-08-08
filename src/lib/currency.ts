export function convertUSDToMXN(valueUSD: number, rate: number): number {
  return valueUSD * rate;
}

export function convertMXNToUSD(valueMXN: number, rate: number): number {
  return valueMXN / rate;
}

// Centraliza la conversión y formateo de valores monetarios para las tablas
export function formatMonetaryValue({
  value,
  originalCurrency,
  displayCurrency,
  exchangeRate,
  tooltipLabel
}: {
  value: number,
  originalCurrency: 'USD' | 'MXN',
  displayCurrency: 'USD' | 'MXN',
  exchangeRate: number,
  tooltipLabel: string
}) {
  let displayValue = value;
  let tooltip = '';
  if (originalCurrency === 'USD' && displayCurrency === 'MXN') {
    displayValue = value * exchangeRate;
    tooltip = `Valor original: $${value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} (USD)`;
  } else if (originalCurrency === 'MXN' && displayCurrency === 'USD') {
    displayValue = value / exchangeRate;
    tooltip = `Valor original: $${value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} (MXN)`;
  } else {
    tooltip = `Valor original: $${value.toLocaleString(originalCurrency === 'USD' ? 'en-US' : 'es-MX', { style: 'currency', currency: originalCurrency })} (${originalCurrency})`;
  }
  return (
    <div className="text-right flex items-center gap-1 justify-end">
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{displayValue.toLocaleString(displayCurrency === 'USD' ? 'en-US' : 'es-MX', { style: 'currency', currency: displayCurrency })}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <span>{tooltip}</span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
