import type { ReactNode } from "react";

interface IconButtonProps {
  children: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function IconButton({
  children,
  label,
  active = false,
  disabled = false,
  onClick,
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`grid size-9 place-items-center rounded-lg transition ${
        active
          ? "bg-brand-50 text-brand-700"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      } disabled:opacity-35`}
      disabled={disabled}
      onClick={onClick}
      title={label}
    >
      {children}
    </button>
  );
}

