"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import useStore from "@/store/store"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Loader2, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { name, email, bio, SetName, SetBio, logout } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    localStorage.removeItem("token")
    router.push("/login")
    toast.success("Logged out successfully")
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    
    const usernameInput = document.getElementById('username').value
    const bioInput = document.getElementById('bio').value
    
    if (!usernameInput || usernameInput.trim().length < 2) {
      toast.error("Username must be at least 2 characters long");
      return;
    }

    setIsLoading(true)
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: usernameInput,
          bio: bioInput
        })
      });
      
      const data = await res.json();
      
      if (data.type === "success") {
        SetName(data.user.name);
        SetBio(data.user.bio);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    
    const currentPassword = document.getElementById('current-password').value
    const newPassword = document.getElementById('new-password').value
    const confirmPassword = document.getElementById('confirm-password').value
    
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    // Password complexity check
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      toast.error("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    setIsPasswordLoading(true)
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/update-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      const data = await res.json();
      
      if (data.type === "success") {
        toast.success(data.message);
        // Clear fields
        document.getElementById('current-password').value = "";
        document.getElementById('new-password').value = "";
        document.getElementById('confirm-password').value = "";
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Password update error:", error);
      toast.error("Failed to update password");
    } finally {
      setIsPasswordLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-10 pb-16 block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <div className="flex-1 lg:max-w-2xl">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>
                    This is how others will see you on the site.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue={name} placeholder="Your username" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue={email} placeholder="Your email" disabled />
                    <p className="text-[0.8rem] text-muted-foreground">
                      Email cannot be changed.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input id="bio" defaultValue={bio} placeholder="I am a teacher at..." />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveProfile} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {isLoading ? "Saving..." : "Save changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>
                    Manage your account settings and password.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleUpdatePassword} disabled={isPasswordLoading}>
                    {isPasswordLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {isPasswordLoading ? "Updating..." : "Update Password"}
                  </Button>
                  
                  <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" />
                    Log out
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize the appearance of the app. Automatically switch between day and night themes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable dark mode for better viewing at night.
                      </p>
                    </div>
                    {mounted && (
                      <Switch
                        checked={resolvedTheme === "dark"}
                        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
