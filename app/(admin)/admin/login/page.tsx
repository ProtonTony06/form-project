import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Iniciar sesión · FormProject",
};

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    redirect("/admin");
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <LoginForm />
    </div>
  );
}
