import { redirect } from "next/navigation";

/**
 * Raíz del proyecto.
 * Siempre redirige a /admin/login; el layout `(admin)` se encarga de enviar
 * al usuario a /admin si ya tiene sesión.
 */
export default function HomePage() {
  redirect("/admin/login");
}
