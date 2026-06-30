export type AuthResult =
  | { success: true; message: string }
  | { success: false; error: string; status?: number }

export type RegisterData = {
  fullName: string,
  email: string,
  password: string,
}

export type LoginData = {
  email: string,
  password: string,
}

export type TokenPair = {
  accessToken: string,
  refreshToken: string,
}

export type User = {
  id: string
	fullName: string
	email: string
	createdAt: string
}
