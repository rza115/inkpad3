"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState: AuthState = { error: null };

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="font-display text-3xl font-semibold text-ink">InkPad</h1>
        <p className="text-sm text-slate">
          {mode === "login"
            ? "Masuk untuk lanjut menulis"
            : "Buat akun untuk mulai menulis"}
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={6}
          required
        />

        {state.error && (
          <p role="alert" className="text-sm text-wine">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending
            ? "Memproses..."
            : mode === "login"
              ? "Masuk"
              : "Daftar"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="text-sm text-slate underline-offset-2 hover:text-wine hover:underline focus-visible:outline-2 focus-visible:outline-wine"
      >
        {mode === "login"
          ? "Belum punya akun? Daftar"
          : "Sudah punya akun? Masuk"}
      </button>
    </div>
  );
}
