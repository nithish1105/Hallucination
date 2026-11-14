import { NextRequest, NextResponse } from "next/server";

const API_BASE = (
  process.env.API_SERVER_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

const ACCESS_COOKIE = "maya_access";
const REFRESH_COOKIE = "maya_refresh";
const ACCESS_TTL = 30 * 60;
const REFRESH_TTL = 7 * 24 * 60 * 60;

type RouteContext = { params: Promise<{ path: string[] }> };

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

async function forward(request: NextRequest, context: RouteContext) {
  const method = request.method.toUpperCase();
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(method);
  const origin = request.headers.get("origin");
  if (unsafe && origin) {
    let originHost = "";
    try {
      originHost = new URL(origin).host.toLowerCase();
    } catch {
      return NextResponse.json({ detail: "Cross-origin request rejected." }, { status: 403 });
    }
    const requestHost = (
      request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host
    ).split(",")[0].trim().toLowerCase();
    if (!requestHost || originHost !== requestHost) {
      return NextResponse.json({ detail: "Cross-origin request rejected." }, { status: 403 });
    }
  }

  const { path } = await context.params;
  const safePath = path.map((part) => encodeURIComponent(part)).join("/");
  const target = `${API_BASE}/${safePath}${new URL(request.url).search}`;
  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  let refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  let originalBody: BodyInit | undefined = unsafe ? await request.arrayBuffer() : undefined;
  let contentType = request.headers.get("content-type");
  if (safePath === "auth/logout" && originalBody instanceof ArrayBuffer && originalBody.byteLength === 0) {
    originalBody = JSON.stringify({ refresh_token: refreshToken ?? null });
    contentType = "application/json";
  }

  const send = (token?: string) => {
    const headers = new Headers();
    if (contentType) headers.set("content-type", contentType);
    const accept = request.headers.get("accept");
    if (accept) headers.set("accept", accept);
    if (token) headers.set("authorization", `Bearer ${token}`);
    return fetch(target, {
      method,
      headers,
      body: originalBody,
      cache: "no-store",
      redirect: "manual",
    });
  };

  try {
    let upstream = await send(accessToken);

    if (
      upstream.status === 401 &&
      refreshToken &&
      !["auth/login", "auth/signup", "auth/refresh", "auth/logout"].includes(safePath)
    ) {
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      });
      if (refreshResponse.ok) {
        const tokens = await refreshResponse.json();
        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token ?? refreshToken;
        upstream = await send(accessToken);
      }
    }

    const isLogin = safePath === "auth/login" || safePath === "auth/signup";
    if (isLogin && upstream.ok) {
      const payload = await upstream.json();
      const { access_token, refresh_token, ...publicPayload } = payload;
      if (!access_token || !refresh_token) {
        return NextResponse.json({ detail: "Authentication response was incomplete." }, { status: 502 });
      }
      const response = NextResponse.json(publicPayload, { status: upstream.status });
      response.cookies.set(ACCESS_COOKIE, access_token, cookieOptions(ACCESS_TTL));
      response.cookies.set(REFRESH_COOKIE, refresh_token, cookieOptions(REFRESH_TTL));
      return response;
    }

    if (safePath === "auth/logout" && upstream.ok) {
      const response = new NextResponse(upstream.body, { status: upstream.status });
      response.cookies.set(ACCESS_COOKIE, "", cookieOptions(0));
      response.cookies.set(REFRESH_COOKIE, "", cookieOptions(0));
      return response;
    }

    const response = new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "cache-control": upstream.headers.get("cache-control") ?? "no-store",
        ...(upstream.headers.get("x-accel-buffering")
          ? { "x-accel-buffering": upstream.headers.get("x-accel-buffering")! }
          : {}),
      },
    });
    if (accessToken && accessToken !== request.cookies.get(ACCESS_COOKIE)?.value) {
      response.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_TTL));
      if (refreshToken) response.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_TTL));
    }
    return response;
  } catch {
    return NextResponse.json(
      { detail: "MAYA could not reach the API. Confirm the backend is running and API_SERVER_URL is correct." },
      { status: 503 },
    );
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
