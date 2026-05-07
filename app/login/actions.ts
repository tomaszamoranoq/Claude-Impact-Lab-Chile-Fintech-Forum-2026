"use server"

import { cookies } from "next/headers"
import { computeDemoToken } from "@/lib/demo-auth"

export async function demoLogin(
  password: string
): Promise<{ error?: string; success?: boolean }> {
  const demoPassword = process.env.DEMO_PASSWORD

  if (!demoPassword) {
    return {
      error:
        "El servidor no está configurado para acceso con contraseña. Revisa DEMO_PASSWORD.",
    }
  }

  if (password !== demoPassword) {
    return { error: "Contraseña incorrecta." }
  }

  const token = await computeDemoToken(demoPassword)
  const cookieStore = await cookies()

  cookieStore.set("demo_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  })

  return { success: true }
}
