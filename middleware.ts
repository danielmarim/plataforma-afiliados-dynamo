import NextAuth from "next-auth";

import authConfig from "@/lib/auth.config";
import {
  API_AUTH_PREFIX,
  DEFAULT_LOGIN_REDIRECT,
  PUBLIC_ROUTES,
} from "@/utils/constants";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(API_AUTH_PREFIX);
  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isPublicRoute = PUBLIC_ROUTES.includes(nextUrl.pathname);
  const isAuthPage = ["/login", "/register", "/forgot-password"].includes(
    nextUrl.pathname
  );

  // Rotas de API de autenticação e demais APIs passam direto
  if (isApiAuthRoute || isApiRoute) return;

  // Usuário logado tentando acessar páginas de auth -> dashboard
  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
  }

  // Usuário não logado em rota protegida -> login
  if (!isPublicRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(
      nextUrl.pathname + nextUrl.search
    );
    return Response.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
