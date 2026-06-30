import { NextRequest, NextResponse } from "next/server"
import { jwtVerify, type JWTPayload, errors } from "jose"
import { apiFetch } from "./http"
import { TokenPair } from "./types"
import { deleteCookies, deleteCookiesOnResponse, setAuthCookies, setAuthCookiesOnResponse } from "./cookies"
import { redirect } from "next/navigation"

const PROACTIVE_REFRESH_THRESHOLD_SECONDS = 2 * 60
const ENCODED_JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export type AccessTokenPayload = JWTPayload & {
  sub: string
}

export type VerifyResult =
  | { status: "valid"; payload: AccessTokenPayload; expiresAt: number }
  | { status: "expiring_soon"; payload: AccessTokenPayload; expiresAt: number }
  | { status: "expired" }
  | { status: "invalid" }

export async function verifyAccessToken(token: string): Promise<VerifyResult> {
  try {
    const { payload } = await jwtVerify(token, ENCODED_JWT_SECRET)
    const exp = payload.exp

    if (!exp) return { status: "invalid" }

    const nowSeconds = Math.floor(Date.now() / 1000)
    const secondsLeft = exp - nowSeconds

    if (secondsLeft <= PROACTIVE_REFRESH_THRESHOLD_SECONDS) {
      return {
        status: "expiring_soon",
        payload: payload as AccessTokenPayload,
        expiresAt: exp,
      }
    }

    return {
      status: "valid",
      payload: payload as AccessTokenPayload,
      expiresAt: exp,
    }
  } catch (err) {
    if (err instanceof errors.JWTExpired) return { status: "expired" }
    return { status: "invalid" }
  }
}

async function attemptRefresh(refreshToken: string): Promise<TokenPair | null> {
  const res = await apiFetch<TokenPair>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ token: refreshToken }),
  })

  if (!res.ok) {
    return null
  }

  return res.data
}

export async function handleTokenRefreshOnResponse(request: NextRequest, refreshToken: string, redirectTo?: string): Promise<NextResponse> {
  try {
      const newTokens = await attemptRefresh(refreshToken)
      if (!newTokens) return deleteCookiesOnResponse(request, process.env.NEXT_PUBLIC_LOGIN_ROUTE as string)

      const response = redirectTo
        ? NextResponse.redirect(new URL(redirectTo, request.url))
        : NextResponse.next()

      return setAuthCookiesOnResponse(response, newTokens)
    } catch (err) {
      return deleteCookiesOnResponse(request, process.env.NEXT_PUBLIC_LOGIN_ROUTE as string)
    }
}

export async function handleTokenRefresh(refreshToken: string): Promise<TokenPair | null> {
  try {
      const newTokens = await attemptRefresh(refreshToken)
      if (!newTokens) {
        await deleteCookies()
        return null
      }

      await setAuthCookies(newTokens)
      return newTokens
    } catch (err) {
      await deleteCookies()
      return null
    }
}
