import { cva, type VariantProps } from "class-variance-authority";

/**
 * Variantes del Button.
 *
 * Este archivo NO tiene "use client" porque debe poder usarse desde
 * Server Components (Next.js 14 hace stubs de los módulos que son
 * "use client", y esos stubs no preservan la función `cva(...)` —
 * se importan como un objeto que no es invocable, lo que rompe
 * cualquier `buttonVariants({...})` en el server).
 *
 * El componente `<Button>` en `components/ui/button.tsx` importa desde
 * aquí, así que el API público no cambia.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300",
        outline:
          "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 active:bg-slate-100",
        ghost:
          "text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
