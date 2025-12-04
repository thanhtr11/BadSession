export function formatVND(value) {
  const num = Number(value || 0);
  if (!isFinite(num)) return '0 ₫';
  // VND usually doesn't use decimals; round to nearest integer
  const rounded = Math.round(num);
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(rounded) + ' ₫';
}
