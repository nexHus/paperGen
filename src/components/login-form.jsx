"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import toast from "react-hot-toast"
import useStore from "@/store/store"
import { useRouter } from "next/navigation"

export function LoginForm({
  className,
  ...props
}) {
  const router = useRouter();
  const { login: storeLogin } = useStore();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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
        router.push("/dashboard");
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
    (<div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <div className="grid gap-6">
            
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    onKeyPress={handleKeyPress}
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
                      Forgot your password?
                    </a>
                  </div>
                  <Input 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    onKeyPress={handleKeyPress}
                    id="password" 
                    type="password" 
                    required 
                    disabled={isLoading}
                  />
                </div>
                <Button onClick={login} className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
    </div>)
  );
}
