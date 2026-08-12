import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Input con label y mensaje de error opcionales.
 * El label y el input quedan asociados vía `htmlFor` / `id` para accesibilidad.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, type = "text", ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const describedById = error
      ? `${inputId}-error`
      : helperText
      ? `${inputId}-helper`
      : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={cn(
            "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900",
            "placeholder:text-slate-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 focus-visible:border-slate-900",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-600",
            className
          )}
          {...props}
        />
        {error ? (
          <p id={describedById} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p id={describedById} className="text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
