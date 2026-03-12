export function getPlaceholderImage(label: string) {
  const safeLabel = encodeURIComponent(label || 'CaipuCodex');
  return `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='480' viewBox='0 0 640 480'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%23FF6B35'/%3E%3Cstop offset='1' stop-color='%23FFB46B'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='640' height='480' rx='32' fill='url(%23g)'/%3E%3Ccircle cx='520' cy='110' r='64' fill='rgba(255,255,255,0.18)'/%3E%3Ctext x='48' y='228' font-size='44' font-family='PingFang SC, sans-serif' fill='white'%3E${safeLabel}%3C/text%3E%3C/svg%3E`;
}
