import { RegisterData, AuthResult, TokenPair, LoginData } from "./types"
import { LoginSchema, RegisterSchema } from "./schemas"
import { apiFetch } from "./http"
import { deleteCookies, getRefreshCookie, setAuthCookies } from "./cookies"
import { MESSAGES } from "./messages"

export async function register(data: RegisterData): Promise<AuthResult> {
  const parsed = RegisterSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const res = await apiFetch<TokenPair>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    return { success: false, error: res.error, status: res.status }
  }

  await setAuthCookies(res.data)
  return { success: true, message: MESSAGES.REGISTER_SUCCESS }
}

export async function login(data: LoginData): Promise<AuthResult> {
  const parsed = LoginSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const res = await apiFetch<TokenPair>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    return { success: false, error: res.error, status: res.status }
  }

  await setAuthCookies(res.data)
  return { success: true, message: MESSAGES.LOGIN_SUCCESS }
}

export async function refresh(): Promise<AuthResult> {
  const refreshToken = await getRefreshCookie()

  if (!refreshToken) {
    await deleteCookies()
    return { success: false, error: MESSAGES.NO_REFRESH_TOKEN }
  }

  const res = await apiFetch<TokenPair>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ token: refreshToken }),
  })

  if (!res.ok) {
    await deleteCookies()
    return { success: false, error: res.error, status: res.status }
  }

  await setAuthCookies(res.data)
  return { success: true, message: MESSAGES.REFRESH_SUCCESS }
}

export async function logout(): Promise<AuthResult> {
  const refreshToken = await getRefreshCookie()
  await deleteCookies()

  if (refreshToken) {
    await apiFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ token: refreshToken }),
    })
  }

  return { success: true, message: MESSAGES.LOGOUT_SUCCESS }
}
