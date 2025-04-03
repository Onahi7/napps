import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    error?: string
    user: {
      id: string
      role: string
      phone: string
      payment_status: string
      accreditation_status: string
      state: string
      lga: string
      chapter: string
      organization: string
      position: string
      full_name: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    phone: string
    payment_status: string
    accreditation_status: string
    state: string
    lga: string
    chapter: string
    organization: string
    position: string
    full_name: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    phone: string
    payment_status: string
    accreditation_status: string
    state: string
    lga: string
    chapter: string
    organization: string
    position: string
    full_name: string
    error?: string
  }
}
