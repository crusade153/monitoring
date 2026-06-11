/** 인증 쿠키 공통 로직 — middleware(Edge)와 Server Action(Node) 양쪽에서 사용 */

export const AUTH_COOKIE = 'dash_auth';
export const AUTH_MAX_AGE = 60 * 60 * 24 * 30; // 30일

/** Web Crypto 기반 SHA-256 hex (Edge/Node 공통) */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
