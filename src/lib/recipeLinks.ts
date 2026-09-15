const XIAOHONGSHU_HOSTS = new Set([
  'xiaohongshu.com',
  'www.xiaohongshu.com',
  'xhslink.com',
  'www.xhslink.com',
]);

export function isValidRecipeUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function extractRecipeUrl(value: string): string {
  const match = value.match(/https?:\/\/[^\s\]<>"']+/i);
  return (match?.[0] || value).replace(/[，。！？,.;]+$/, '');
}

export function isXiaohongshuUrl(value: string): boolean {
  try {
    return XIAOHONGSHU_HOSTS.has(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function getXiaohongshuDeepLink(value: string): string | null {
  if (!isXiaohongshuUrl(value)) return null;
  try {
    const match = new URL(value).pathname.match(/\/(?:discovery\/item|explore)\/([a-zA-Z0-9]+)/);
    return match ? `xhsdiscover://item/${match[1]}` : null;
  } catch {
    return null;
  }
}
