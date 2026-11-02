"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-pine-900/20 bg-white px-3 py-2.5 outline-none focus:border-lake-600 focus:ring-2 focus:ring-lake-100";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="text-sm font-semibold text-pine-900">Vartotojo vardas</span>
        <input
          name="user"
          required
          autoComplete="username"
          autoCapitalize="none"
          defaultValue={state.user}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-pine-900">Slaptažodis</span>
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-full bg-wood-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-wood-600 disabled:bg-stone-300"
      >
        {pending ? "Jungiamasi…" : "Prisijungti"}
      </button>
    </form>
  );
}
