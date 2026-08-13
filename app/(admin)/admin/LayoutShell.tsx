import Link from "next/link";
import { FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutShellProps {
  userEmail: string;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}

/**
 * Shell visual compartido: header sticky + main con max-w-7xl.
 * Server Component (no usa estado ni efectos).
 */
export function LayoutShell({ userEmail, signOutAction, children }: LayoutShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            aria-label="Volver al dashboard"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900">
              FormProject
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span
              className="hidden text-sm text-slate-600 sm:inline"
              aria-label={`Sesión iniciada como ${userEmail}`}
            >
              {userEmail}
            </span>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Cerrar sesión</span>
                <span className="sr-only sm:hidden">Cerrar sesión</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
