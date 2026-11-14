import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export const PORTAL_OBE_URL = 'https://obe.simpatti.site';
export const SSO_COOKIE_NAME = 'simpatti_sso_session';
export const SSO_COOKIE_DOMAIN = '.simpatti.site';

export const SIMPATTI_MODULES = {
  portal: 'https://obe.simpatti.site',
  kurikulum: 'https://kurikulum.simpatti.site',
  rps: 'https://rps.simpatti.site',
  bukuAjar: 'https://bukuajar.simpatti.site',
  rubrik: 'https://rubrik.simpatti.site',
  portofolio: 'https://portofolio.simpatti.site',
  cpl: 'https://cpl.simpatti.site',
  cqi: 'https://cqi.simpatti.site',
} as const;

export interface SsoTokens {
  access_token: string;
  refresh_token: string;
}

export interface SsoUserIdentity {
  fullName: string;
  prodi: string;
  email: string;
}

export function extractUserIdentity(user: User | null): SsoUserIdentity {
  if (!user) {
    return { fullName: '', prodi: '', email: '' };
  }
  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const fullName =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.nama_lengkap === 'string' && meta.nama_lengkap.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    user.email ||
    'Dosen Pengampu';
  const prodi =
    (typeof meta.prodi === 'string' && meta.prodi.trim()) ||
    (typeof meta.program_studi === 'string' && meta.program_studi.trim()) ||
    '';

  return {
    fullName,
    prodi,
    email: user.email || '',
  };
}

function parseTokenPayload(raw: string): SsoTokens | null {
  if (!raw) return null;
  const decoded = decodeURIComponent(raw).trim();

  // 1. Direct JSON string
  if (decoded.startsWith('{')) {
    try {
      const parsed = JSON.parse(decoded) as Partial<SsoTokens>;
      if (parsed.access_token && parsed.refresh_token) {
        return {
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        };
      }
    } catch {
      // ignore and try next format
    }
  }

  // 2. Base64-encoded JSON string
  try {
    const base64Normalized = decoded.replace(/-/g, '+').replace(/_/g, '/');
    const jsonText = atob(base64Normalized);
    if (jsonText.startsWith('{')) {
      const parsed = JSON.parse(jsonText) as Partial<SsoTokens>;
      if (parsed.access_token && parsed.refresh_token) {
        return {
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        };
      }
    }
  } catch {
    // ignore
  }

  // 3. Delimited "access_token|refresh_token"
  if (decoded.includes('|')) {
    const [access_token, refresh_token] = decoded.split('|');
    if (access_token && refresh_token) {
      return { access_token, refresh_token };
    }
  }

  return null;
}

function extractTokensFromUrlHash(): SsoTokens | null {
  const hash = window.location.hash;
  if (!hash || !hash.includes('sso_token=')) return null;

  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(cleanHash);
  const rawToken = params.get('sso_token');
  if (!rawToken) return null;

  const parsed = parseTokenPayload(rawToken);
  if (parsed) return parsed;

  const refreshParam = params.get('refresh_token');
  if (rawToken && refreshParam) {
    return {
      access_token: rawToken,
      refresh_token: refreshParam,
    };
  }

  return null;
}

function extractTokensFromSsoCookie(): SsoTokens | null {
  if (typeof document === 'undefined' || !document.cookie) return null;

  const cookies = document.cookie.split(';');
  for (const item of cookies) {
    const trimmed = item.trim();
    if (trimmed.startsWith(`${SSO_COOKIE_NAME}=`)) {
      const value = trimmed.slice(SSO_COOKIE_NAME.length + 1);
      return parseTokenPayload(value);
    }
  }
  return null;
}

export function writeSsoCookie(session: Session | null): void {
  if (typeof document === 'undefined' || !session?.access_token || !session?.refresh_token) {
    return;
  }

  const payload = encodeURIComponent(
    JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
  );

  const isSimpattiDomain = window.location.hostname.endsWith('simpatti.site');
  const domainPart = isSimpattiDomain ? `; domain=${SSO_COOKIE_DOMAIN}` : '';
  const securePart = window.location.protocol === 'https:' ? '; Secure' : '';

  document.cookie = `${SSO_COOKIE_NAME}=${payload}; path=/; max-age=604800; SameSite=Lax${domainPart}${securePart}`;
}

export function clearSsoCookie(): void {
  if (typeof document === 'undefined') return;
  const isSimpattiDomain = window.location.hostname.endsWith('simpatti.site');
  const domainPart = isSimpattiDomain ? `; domain=${SSO_COOKIE_DOMAIN}` : '';
  document.cookie = `${SSO_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax${domainPart}`;
  document.cookie = `${SSO_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

function cleanUrlHash(): void {
  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, '', cleanUrl);
}

export async function resolveSsoSession(): Promise<{
  session: Session | null;
  source: 'supabase' | 'url_hash' | 'cookie' | 'none';
}> {
  if (!supabase) {
    return { session: null, source: 'none' };
  }

  // 1. Check built-in Supabase session
  const { data: currentData } = await supabase.auth.getSession();
  if (currentData.session) {
    writeSsoCookie(currentData.session);
    return { session: currentData.session, source: 'supabase' };
  }

  // 2. Check #sso_token=... in URL hash
  const hashTokens = extractTokensFromUrlHash();
  if (hashTokens) {
    const { data, error } = await supabase.auth.setSession({
      access_token: hashTokens.access_token,
      refresh_token: hashTokens.refresh_token,
    });
    cleanUrlHash();
    if (!error && data.session) {
      writeSsoCookie(data.session);
      return { session: data.session, source: 'url_hash' };
    }
  }

  // 3. Check cross-subdomain cookie simpatti_sso_session on .simpatti.site
  const cookieTokens = extractTokensFromSsoCookie();
  if (cookieTokens) {
    const { data, error } = await supabase.auth.setSession({
      access_token: cookieTokens.access_token,
      refresh_token: cookieTokens.refresh_token,
    });
    if (!error && data.session) {
      return { session: data.session, source: 'cookie' };
    }
  }

  return { session: null, source: 'none' };
}

export async function signInWithPasswordSso(
  email: string,
  password: string
): Promise<{ session: Session | null; error?: string }> {
  if (!supabase) {
    return { session: null, error: 'Klien Supabase belum terkonfigurasi.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { session: null, error: error.message };
  }

  if (data.session) {
    writeSsoCookie(data.session);
  }

  return { session: data.session };
}

export async function signOutSso(): Promise<void> {
  clearSsoCookie();
  if (supabase) {
    await supabase.auth.signOut();
  }
}

export function buildModuleRelayUrl(
  baseUrl: string,
  params: Record<string, string | undefined>,
  session: Session | null
): string {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  if (session?.access_token && session?.refresh_token) {
    const tokenPayload = encodeURIComponent(
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
    );
    url.hash = `sso_token=${tokenPayload}`;
  }

  return url.toString();
}
