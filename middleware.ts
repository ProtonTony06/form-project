import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware mínimo: reenvía la ruta actual al header `x-pathname` para que
 * el layout `(admin)` pueda distinguir `/admin/login` del resto.
 *
 * No tocamos la sesión aquí: la lógica de redirección por sesión vive en el
 * layout (`app/(admin)/admin/layout.tsx`) que corre en Node runtime.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
