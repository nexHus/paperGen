"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AuthGuard({ children }) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem("token")
    
    if (!token) {
      // No token found, redirect to login
      router.push("/login")
    } else {
      // Token exists, allow access
      setIsChecking(false)
    }
  }, [router])

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Verifying session...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
