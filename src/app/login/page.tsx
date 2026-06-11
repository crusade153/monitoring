'use client';

import { useActionState } from 'react';
import { login, type LoginState } from './actions';

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <form action={formAction} className="w-full max-w-sm">
        <p className="font-mono text-xs tracking-[0.3em] text-accent">H2 MORNING WATCH</p>
        <h1 className="mt-2 text-2xl font-bold">팀 대시보드 접속</h1>
        <p className="mt-1 text-sm text-muted">공유받은 비밀번호를 입력하세요.</p>

        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="비밀번호"
          className="mt-6 w-full rounded-md border border-line bg-card px-4 py-3 font-mono text-ink outline-none transition focus:border-accent"
        />
        {state.error && <p className="mt-2 text-sm text-up">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-md bg-accent py-3 font-semibold text-bg transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-50"
        >
          {pending ? '확인 중…' : '접속'}
        </button>
      </form>
    </main>
  );
}
