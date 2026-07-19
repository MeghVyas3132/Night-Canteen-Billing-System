/**
 * Money is stored and computed as integer paise everywhere. Format only at the
 * very edge, for display. ₹50 for whole rupees; ₹70.50 when there are paise.
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  const hasPaise = paise % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}
