import { z } from "zod"

export const RegisterSchema = z.object({
  fullName: z.string().min(1, "Le nom complet est requis."),
  email: z.email("L'email n'est pas valide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
})

export const LoginSchema = z.object({
  email: z.email("L'email n'est pas valide."),
  password: z.string().min(1, "Le mot de passe est requis."),
})
