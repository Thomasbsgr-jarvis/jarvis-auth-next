import { cookies } from "next/headers"
import { TokenPair } from "./types"
import { NextRequest, NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { handleTokenRefresh } from "./jwt"

const accessOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 15,
}

const refreshOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
}

export async function setAuthCookies({ accessToken, refreshToken }: TokenPair) {
  const store = await cookies()
  store.set("access_token", accessToken, accessOptions)
  store.set("refresh_token", refreshToken, refreshOptions)
}

export function setAuthCookiesOnResponse(response: NextResponse, { accessToken, refreshToken }: TokenPair): NextResponse {
  response.cookies.set("access_token", accessToken, accessOptions)
  response.cookies.set("refresh_token", refreshToken, refreshOptions)
  return response
}

export async function deleteCookies() {
  const store = await cookies()
  store.delete("access_token")
  store.delete("refresh_token")
}

export function deleteCookiesOnResponse(request: NextRequest, loginRoute: string): NextResponse {
  const response = NextResponse.redirect(new URL(loginRoute, request.url))
  response.cookies.delete("access_token")
  response.cookies.delete("refresh_token")
  return response
}

export async function getRefreshCookie() {
  const store = await cookies()
  return store.get("refresh_token")?.value
}

export async function getAccessCookie() {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value
  if (!token) {
    const refresh = cookieStore.get("refresh_token")?.value
    if (!refresh) {
      return null
    }
    const tokens = await handleTokenRefresh(refresh)
    if (!tokens) {
      await deleteCookies()
      return null
    }

    return tokens.accessToken
  }

  return token
}
