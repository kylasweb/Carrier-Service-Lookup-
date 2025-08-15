import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function auth() {
  return await getServerSession(authOptions)
}

export { signIn, signOut } from "next-auth/react"