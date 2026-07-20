import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protección de rutas a nivel de servidor. La sesión "real" (permisos sobre
// los datos) la valida Supabase vía RLS + token; esta capa evita que alguien
// sin sesión llegue siquiera a cargar las páginas internas de la app.
const PROTECTED_PREFIXES = [
  "/home",
  "/juegos",
  "/historias",
  "/misiones",
  "/taller",
  "/diario",
  "/viaje",
  "/logros",
  "/estadisticas",
  "/select-hero",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get("academia_session")?.value);
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/juegos/:path*", "/historias/:path*", "/misiones/:path*", "/taller/:path*", "/diario/:path*", "/viaje/:path*", "/logros/:path*", "/estadisticas/:path*", "/select-hero"],
};
