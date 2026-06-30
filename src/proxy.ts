import { NextRequest, NextResponse } from "next/server"
import { handleTokenRefreshOnResponse, verifyAccessToken } from "./jwt"

export type AuthMiddlewareConfig = {
  publicRoutes: readonly string[]
}

export function createAuthMiddleware({ publicRoutes }: AuthMiddlewareConfig) {
  return async function proxy(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl
    const isPublicRoute = (publicRoutes).includes(pathname)

    const accessToken = request.cookies.get("access_token")?.value
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (isPublicRoute) {
      if (accessToken) {
        const result = await verifyAccessToken(accessToken)
        if (result.status === "valid" || result.status === "expiring_soon") {
          return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_HOME_ROUTE as string, request.url))
        }

        if (refreshToken) {
          const response = await handleTokenRefreshOnResponse(request, refreshToken, process.env.NEXT_PUBLIC_HOME_ROUTE)
          return response
        }

        const response = NextResponse.next()
        response.cookies.delete("access_token")
        return response
      }

      if (refreshToken) {
        const response = await handleTokenRefreshOnResponse(request, refreshToken, process.env.NEXT_PUBLIC_HOME_ROUTE)
        return response
      }

      return NextResponse.next()
    }

    if (accessToken) {
      const result = await verifyAccessToken(accessToken)

      if (result.status === "valid") {
        return NextResponse.next()
      }

      if (result.status === "expiring_soon") {
        if (!refreshToken) {
          return NextResponse.next()
        }

        const response = await handleTokenRefreshOnResponse(request, refreshToken)
        return response
      }

      if (result.status === "expired") {
        if (!refreshToken) {
          const response = NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_LOGIN_ROUTE as string, request.url))
          response.cookies.delete("access_token")
          return response
        }

        const response = await handleTokenRefreshOnResponse(request, refreshToken)
        return response
      }

      if (result.status === "invalid") {
        const response = NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_LOGIN_ROUTE as string, request.url))
        response.cookies.delete("access_token")
        response.cookies.delete("refresh_token")
        return response
      }
    }

    if (!refreshToken) {
      return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_LOGIN_ROUTE as string, request.url))
    }

    const response = await handleTokenRefreshOnResponse(request, refreshToken)
    return response
  }
}
