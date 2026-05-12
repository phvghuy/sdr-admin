import { Truck } from "lucide-react"

import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#262626] p-6 text-white md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium text-white">
          <div className="flex size-6 items-center justify-center rounded-md bg-white">
            <Truck className="size-5 text-[#262626]" />
          </div>
          Smart Delivery Routing
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
