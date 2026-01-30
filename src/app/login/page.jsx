import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <GalleryVerticalEnd className="size-5" />
            </div>
            <span className="text-xl">PaperGenie</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
      
      {/* Right side - Branding/Image */}
      <div className="bg-primary relative hidden lg:block">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-10">
          <div className="text-primary-foreground max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-primary-foreground/10 rounded-full p-6">
                <GalleryVerticalEnd className="text-primary-foreground size-16" />
              </div>
            </div>
            <h2 className="mb-4 text-3xl font-bold">Welcome Back!</h2>
            <p className="text-primary-foreground/80 text-lg">
              Sign in to access your assessments, curriculum materials, and continue creating amazing educational content with AI-powered tools.
            </p>
          </div>
          {/* Decorative elements */}
          <div className="bg-primary-foreground/5 absolute top-10 left-10 size-32 rounded-full blur-3xl" />
          <div className="bg-primary-foreground/5 absolute right-10 bottom-10 size-48 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}
