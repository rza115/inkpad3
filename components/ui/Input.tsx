import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, id, className = "", ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1">
      {label && (
        <span className="text-sm font-medium text-slate">{label}</span>
      )}
      <input
        id={id}
        className={`rounded border border-slate/40 bg-parchment px-3 py-2 text-sm text-ink placeholder:text-slate/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wine ${className}`}
        {...props}
      />
    </label>
  );
}
