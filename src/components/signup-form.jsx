"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react"

export function SignupForm({
  className,
  ...props
}) {
  const [name, setName]= useState("")
  const [email, setEmail]= useState("")
  const [password, setPassword]= useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Client-side validation
  const validateForm = () => {
    if (!name || !name.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return false;
    }
    if (!email || !email.trim()) {
      toast.error("Please enter your email");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!password) {
      toast.error("Please enter a password");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      signup();
    }
  };

  const signup = async() => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      toast.loading("Creating account...", { id: 'signup' });
      const data = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password
      }
      const req = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const res = await req.json();
      console.log(res);
      toast.dismiss('signup');
      if (res.type == "success") {
        toast.success(res.message)
        router.push("/login")
      }
      else {
        toast.error(res.message)
      }
    }
    catch(error) {
      toast.dismiss('signup');
      toast.error("An error occurred while creating your account. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground text-sm">
          Enter your details to get started with PaperGenie
        </p>
      </div>
      
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input 
              id="name" 
              value={name} 
              onChange={e=>setName(e.target.value)} 
              onKeyPress={handleKeyPress}
              placeholder="John Doe"
              className="pl-10"
              disabled={isLoading}
              required 
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input 
              id="email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              onKeyPress={handleKeyPress}
              type="email" 
              placeholder="name@example.com" 
              className="pl-10"
              disabled={isLoading}
              required 
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              onKeyPress={handleKeyPress}
              id="password" 
              type={showPassword ? "text" : "password"}
              placeholder="Min. 6 characters"
              className="pl-10 pr-10"
              disabled={isLoading}
              required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-muted-foreground text-xs">
            Must be at least 6 characters long
          </p>
        </div>

        <Button onClick={signup} className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Already have an account?
          </span>
        </div>
      </div>

      <div className="text-center text-sm">
        <Link 
          href="/login" 
          className="text-primary font-medium underline underline-offset-4 hover:opacity-80"
        >
          Sign in
        </Link>
      </div>

      <p className="text-muted-foreground px-4 text-center text-xs">
        By creating an account, you agree to our{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
