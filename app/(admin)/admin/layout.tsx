import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { LayoutShell } from "./LayoutShell";

export const metadata = {
  title: "Admin · FormProject",
};

/**
 * Layout protegido del grupo `(admin)`.
 *
 * Reglas:
 *  - Sin sesión y ruta != /admin/login → redirige a /admin/login.
 *  - Con sesión y ruta == /admin/login → redirige a /admin (evita doble render).
 *  - El resto: renderiza el shell con header y children.
 *
 * La detección de la ruta se hace leyendo `x-pathname` (seteada por middleware,
 * ver `middleware.ts`). Si no está presente, asumimos ruta protegida.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "";

  const isLoginRoute = pathname === "/admin/login";

  if (!session && !isLoginRoute) {
    redirect("/admin/login");
  }
  if (session && isLoginRoute) {
    redirect("/admin");
  }

  // En /admin/login NO mostramos header (lo gestiona la propia página de login).
  if (isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <LayoutShell
      userEmail={session?.user?.email ?? ""}
      signOutAction={async () => {
        "use server";
        await signOut({ redirectTo: "/admin/login" });
      }}
    >
      {children}
    </LayoutShell>
  );
}
