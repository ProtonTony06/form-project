"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Email o contraseña incorrectos.",
  default: "No se pudo iniciar sesión. Inténtalo de nuevo.",
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!result) {
        setError(ERROR_MESSAGES.default);
        return;
      }
      if (result.error) {
        setError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.default);
        return;
      }
      if (result.ok) {
        router.push("/admin");
        router.refresh();
      }
    } catch (err) {
      console.error("[LoginForm] error inesperado:", err);
      setError(ERROR_MESSAGES.default);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
          <FileText className="h-6 w-6" aria-hidden="true" />
        </div>
        <CardTitle className="text-2xl">FormProject</CardTitle>
        <CardDescription>
          Accede al panel de administración
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Input
            label="Contraseña"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            loadingText="Iniciando…"
            className="w-full"
          >
            Iniciar sesión
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
