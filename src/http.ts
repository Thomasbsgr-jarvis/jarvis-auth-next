import { MESSAGES } from "./messages"

type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string }
type ErrorBody = { message?: string }

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(`${process.env.API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  const body = (await res.json().catch(() => null)) as (ErrorBody & T) | null
  if (!res.ok) return { ok: false, status: res.status, error: body?.message ?? MESSAGES.UNEXPECTED }
  return { ok: true, data: body as T }
}
