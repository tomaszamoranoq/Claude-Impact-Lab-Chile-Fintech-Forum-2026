import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { computeDemoToken } from "@/lib/demo-auth"

const PROTECTED_API_PREFIXES = [
  "/api/agent",
  "/api/launch-agent",
  "/api/interpret-action",
  "/api/agent-actions",
  "/api/documents",
  "/api/cash-transactions",
  "/api/business-diagnosis",
  "/api/roadmap-items",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (request.method === "OPTIONS") {
    return NextResponse.next()
  }

  const isApi = PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )
  const isApp = pathname.startsWith("/app")

  if (!isApi && !isApp) {
    return NextResponse.next()
  }

  const token = request.cookies.get("demo_session")?.value

  if (!process.env.DEMO_PASSWORD) {
    if (isApi) {
      return NextResponse.json(
        { success: false, error: "Server misconfigured: DEMO_PASSWORD not set" },
        { status: 500 }
      )
    }
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("error", "server-misconfigured")
    return NextResponse.redirect(loginUrl)
  }

  const expectedToken = await computeDemoToken(process.env.DEMO_PASSWORD)

  if (!token || token !== expectedToken) {
    if (isApi) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/app/:path*",
    "/api/agent/:path*",
    "/api/launch-agent/:path*",
    "/api/interpret-action/:path*",
    "/api/agent-actions/:path*",
    "/api/documents/:path*",
    "/api/cash-transactions/:path*",
    "/api/business-diagnosis/:path*",
    "/api/roadmap-items/:path*",
  ],
}
