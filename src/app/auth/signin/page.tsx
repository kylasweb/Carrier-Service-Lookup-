"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Ship, Lock, User, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SignIn() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const { toast } = useToast()

  const handleQuickLogin = async (userType: 'admin' | 'user') => {
    const credentials = userType === 'admin' 
      ? { username: 'admin', password: 'admin123' }
      : { username: 'user', password: 'user123' }

    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        username: credentials.username,
        password: credentials.password,
        redirect: false
      })

      if (result?.error) {
        setError("Login failed")
        toast({
          title: "Authentication Failed",
          description: "Quick login failed",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Welcome back!",
          description: `Logged in as ${userType}`
        })
        router.push(callbackUrl)
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An error occurred during quick login.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false
      })

      if (result?.error) {
        setError("Invalid username or password")
        toast({
          title: "Authentication Failed",
          description: "Invalid username or password",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in."
        })
        router.push(callbackUrl)
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-blue/10 via-pastel-purple/10 to-pastel-pink/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card hover:shadow-xl transition-all duration-300">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 glass-card p-2 rounded-full flex items-center justify-center">
              <Ship className="h-8 w-8 text-pastel-purple" />
            </div>
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-pastel-purple to-pastel-pink bg-clip-text text-transparent">Sign In</CardTitle>
          <CardDescription>
            Welcome to SWENLOG Carrier Service Lookup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="glass-card">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-pastel-purple">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pastel-blue h-4 w-4" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="pl-10 glass-input border-pastel-blue/30 focus:border-pastel-blue"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-pastel-purple">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pastel-blue h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-10 glass-input border-pastel-green/30 focus:border-pastel-green"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full glass-button bg-gradient-to-r from-pastel-blue to-pastel-purple hover:from-pastel-blue/80 hover:to-pastel-purple/80 text-white" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            <div className="text-xs text-center text-muted-foreground mb-2">Or quick login as:</div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickLogin('admin')}
                disabled={loading}
                className="glass-button border-pastel-blue/50 text-pastel-blue hover:bg-pastel-blue/10"
              >
                <Zap className="h-3 w-3 mr-1" />
                Admin
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickLogin('user')}
                disabled={loading}
                className="glass-button border-pastel-green/50 text-pastel-green hover:bg-pastel-green/10"
              >
                <Zap className="h-3 w-3 mr-1" />
                User
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 glass-card rounded-lg">
            <h4 className="font-medium text-sm mb-2 text-pastel-purple">Test Credentials:</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div><strong className="text-pastel-blue">Admin:</strong> admin / admin123</div>
              <div><strong className="text-pastel-green">User:</strong> user / user123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}