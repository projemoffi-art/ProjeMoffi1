export function formatRelativeTime(date: Date | string, language: string = 'tr'): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return language === 'tr' ? 'Az önce' : 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return language === 'tr' ? `${diffInMinutes} dk önce` : `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return language === 'tr' ? `${diffInHours} sa önce` : `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return language === 'tr' ? `${diffInDays} gün önce` : `${diffInDays}d ago`;
  }

  return past.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US');
}
