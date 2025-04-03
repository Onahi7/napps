"use client"

import { SessionProvider, signOut, useSession } from "next-auth/react"
import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"

function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      // If we have a refresh token error, sign out and redirect to login
      signOut({ redirect: false }).then(() => {
        router.push(`/login?error=${encodeURIComponent('Your session has expired. Please log in again.')}`)
      })
    }
  }, [session, router])

  return <>{children}</>
}

export function NextAuthProvider({ 
  children,
}: { 
  children: ReactNode
}) {
  return (
    <SessionProvider 
      refetchInterval={60 * 30} // Refetch session every 30 minutes
      refetchOnWindowFocus={true}
    >
      <AuthGuard>{children}</AuthGuard>
    </SessionProvider>
  )
}
