/** Money helpers. Everything is integer paise. */

export const PAISE_PER_RUPEE = 100;

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * PAISE_PER_RUPEE);
}

export function paiseToRupees(paise: number): number {
  return paise / PAISE_PER_RUPEE;
}

/**
 * Format paise as an Indian-locale currency string.
 * 2499 -> "₹24.99", 300000 -> "₹3,000"
 * Indian digit grouping is handled by Intl with the en-IN locale.
 */
export function formatPrice(paise: number, opts: { decimals?: boolean } = {}): string {
  const rupees = paiseToRupees(paise);
  const showDecimals = opts.decimals ?? rupees % 1 !== 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(rupees);
}

/** Percentage saved off the MRP, 0..100. Returns 0 when there is no discount. */
export function discountPercent(mrpPaise: number, pricePaise: number): number {
  if (mrpPaise <= 0 || pricePaise >= mrpPaise) return 0;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
