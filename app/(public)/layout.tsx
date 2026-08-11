/**
 * Layout del grupo (public).
 *
 * Minimalista a propósito: las páginas públicas (/f/[slug]) no necesitan
 * header con navegación ni sidebar. Solo un fondo neutro y tipografía
 * consistente con el resto del proyecto.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 font-[family-name:var(--font-geist-sans)] text-slate-900 antialiased">
      {children}
    </div>
  );
}
