import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variantClasses = {
  primary:
    "bg-wine text-parchment hover:bg-wine/90 focus-visible:outline-wine",
  secondary:
    "border border-slate/40 text-ink hover:bg-ink/5 focus-visible:outline-slate",
  ghost: "text-slate hover:bg-ink/5 hover:text-ink focus-visible:outline-slate",
  danger:
    "border border-wine/40 text-wine hover:bg-wine/10 focus-visible:outline-wine",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
