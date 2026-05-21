import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { login } from "@/api/auth"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { access_token } = await login(email, password)
      localStorage.setItem('access_token', access_token)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-[#171717] border-none ring-0">
        <CardHeader className="text-center py-6">
          <CardTitle className="text-xl text-white">Welcome back</CardTitle>
          <CardDescription className="text-white/60">
            Login with your account
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="email" className="text-white">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 bg-[#262626] border-[#444] text-white placeholder:text-white/30"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password" className="text-white">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm text-white/60 underline-offset-4 hover:text-white hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 bg-[#262626] border-[#444] text-white"
                />
              </Field>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <Field>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-10 bg-white text-[#171717] hover:bg-white/90 disabled:opacity-60"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <p className="text-xs font-medium text-white/40 mb-2">Demo account</p>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-white/60">
              <span className="text-white/30">Email</span>&ensp;demo@sdr.com
            </p>
            <p className="text-xs text-white/60">
              <span className="text-white/30">Password</span>&ensp;demo123
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setEmail('demo@sdr.com'); setPassword('demo123') }}
            className="text-xs font-medium text-[#171717] bg-white hover:bg-white/90 transition-colors px-3 py-1.5 rounded-lg"
          >
            Fill
          </button>
        </div>
      </div>
    </div>
  )
}
