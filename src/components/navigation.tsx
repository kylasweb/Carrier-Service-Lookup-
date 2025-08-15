"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Ship, User, LogOut } from "lucide-react"
import Link from "next/link"
import { SwenlogLogo } from "./swenlog-logo"
import { ThemeToggle } from "./theme-toggle"

export function Navigation() {
  const { data: session, status } = useSession()

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <SwenlogLogo size="lg" />
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {status === "loading" ? (
              <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
            ) : session ? (
              <>
                {session.user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-muted-foreground hover:text-pastel-blue transition-colors glass-button px-3 py-1 rounded-full"
                  >
                    Admin Panel
                  </Link>
                )}
                <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-full">
                  <User className="h-4 w-4 text-pastel-purple" />
                  <span className="text-sm font-medium text-foreground">
                    {session.user.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                    className="p-2 h-8 w-8 hover:bg-pastel-pink/20"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Link href="/auth/signin">
                <Button variant="outline" size="sm" className="glass-button hover:bg-pastel-green/20">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}