// Format currency for Nigerian Naira
export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString()}`
}