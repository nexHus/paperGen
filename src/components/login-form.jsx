"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import toast from "react-hot-toast"
import useStore from "@/store/store"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"

export function LoginForm({
  className,
  ...props
}) {
  const router = useRouter();
  const { login: storeLogin } = useStore();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validateForm = () => {
    if (!email || !email.trim()) {
      toast.error("Please enter your email address");
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!password) {
      toast.error("Please enter your password");
      return false;
    }
    return true;
  };

  const login = async () => {
    if (!validateForm()) return;
    if (isLoading) return; // Prevent double submission

    const data = {
      email: email.trim().toLowerCase(),
      password: password
    }
    
    setIsLoading(true);
    const loadingToast = toast.loading("Logging in...");
    
    try {
      const req = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const res = await req.json();
      console.log(res);
      toast.dismiss(loadingToast);
      
      if (res.type === "success") {
        toast.success(res.message);
        localStorage.setItem("token", res.token);
        // Use the new login action to set all user data at once
        storeLogin({
          email: res.user.email,
          userId: res.user.userId,
          name: res.user.name
        });
        router.push("/");
      } else {
        toast.error(res.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.dismiss(loadingToast);
      toast.error("Unable to connect to server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      login();
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Enter your credentials to access your account
        </p>
      </div>
      
      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              onKeyPress={handleKeyPress}
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              className="pl-10"
              required 
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link 
              href="#" 
              className="text-muted-foreground hover:text-primary text-xs underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              onKeyPress={handleKeyPress}
              id="password" 
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="pl-10 pr-10"
              required 
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        
        <Button onClick={login} className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            New to PaperGenie?
          </span>
        </div>
      </div>

      <div className="text-center text-sm">
        <Link 
          href="/signup" 
          className="text-primary font-medium underline underline-offset-4 hover:opacity-80"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
