import { GalleryVerticalEnd, CheckCircle2 } from "lucide-react"
import { SignupForm } from "@/components/signup-form"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left side - Branding/Image */}
      <div className="bg-primary relative hidden lg:block">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-10">
          <div className="text-primary-foreground max-w-md">
            <div className="mb-6 flex justify-center">
              <div className="bg-primary-foreground/10 rounded-full p-6">
                <GalleryVerticalEnd className="text-primary-foreground size-16" />
              </div>
            </div>
            <h2 className="mb-4 text-center text-3xl font-bold">Join PaperGenie</h2>
            <p className="text-primary-foreground/80 mb-8 text-center text-lg">
              Create powerful assessments and curriculum materials with AI assistance.
            </p>
            
            {/* Feature list */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-primary-foreground/80 size-5 flex-shrink-0" />
                <span className="text-primary-foreground/90">Generate assessments in minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-primary-foreground/80 size-5 flex-shrink-0" />
                <span className="text-primary-foreground/90">Manage curriculum materials easily</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-primary-foreground/80 size-5 flex-shrink-0" />
                <span className="text-primary-foreground/90">AI-powered content suggestions</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-primary-foreground/80 size-5 flex-shrink-0" />
                <span className="text-primary-foreground/90">Export to multiple formats</span>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="bg-primary-foreground/5 absolute top-10 right-10 size-32 rounded-full blur-3xl" />
          <div className="bg-primary-foreground/5 absolute bottom-10 left-10 size-48 rounded-full blur-3xl" />
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-end">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <GalleryVerticalEnd className="size-5" />
            </div>
            <span className="text-xl">PaperGenie</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
