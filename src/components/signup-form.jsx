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
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"

export function SignupForm({
  className,
  ...props
}) {
  const [name, setName]= useState("")
  const [email, setEmail]= useState("")
  const [password, setPassword]= useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    (<div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create New Account</CardTitle>
          <CardDescription>
            Create new account by entering your details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <div className="grid gap-6">
            
              <div className="grid gap-6">


                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={email} 
                    onChange={e=>setEmail(e.target.value)} 
                    onKeyPress={handleKeyPress}
                    type="email" 
                    placeholder="m@example.com" 
                    disabled={isLoading}
                    required 
                  />
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="name">Full Name</Label>
                  </div>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={e=>setName(e.target.value)} 
                    onKeyPress={handleKeyPress}
                    placeholder="John Doe"
                    disabled={isLoading}
                    required 
                  />
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input 
                    value={password} 
                    onChange={e=>setPassword(e.target.value)} 
                    onKeyPress={handleKeyPress}
                    id="password" 
                    type="password" 
                    placeholder="Min. 6 characters"
                    disabled={isLoading}
                    required 
                  />
                </div>

                <Button onClick={signup} className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Signup"}
                </Button>
              </div>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
    </div>)
  );
}
