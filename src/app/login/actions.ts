'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE, AUTH_MAX_AGE, sha256Hex } from '@/lib/auth';

export interface LoginState {
  error: string | null;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get('password');
  if (
    typeof password !== 'string' ||
    !process.env.DASH_PASSWORD ||
    password !== process.env.DASH_PASSWORD
  ) {
    return { error: '비밀번호가 올바르지 않습니다.' };
  }

  (await cookies()).set(AUTH_COOKIE, await sha256Hex(password), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: AUTH_MAX_AGE,
    path: '/',
  });
  redirect('/');
}
