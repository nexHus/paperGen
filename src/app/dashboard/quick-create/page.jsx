"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Sparkles } from "lucide-react"

export default function QuickCreatePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    topic: "",
    gradeLevel: "",
    subject: "",
    questionCount: "5",
    questionType: "multiple-choice"
  })

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.topic || !formData.gradeLevel || !formData.subject) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success("Assessment criteria generated!")
    
    // In a real app, this would redirect to the generation page with params
    // router.push(`/dashboard/generate-assessment?topic=${encodeURIComponent(formData.topic)}...`)
    
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Quick Create</h1>
          <p className="text-muted-foreground">
            Generate an assessment in seconds using AI. Just describe what you need.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
            <CardDescription>
              Enter the topic and requirements for your new assessment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic / Concept</Label>
              <Input 
                id="topic" 
                placeholder="e.g. Photosynthesis, The Civil War, Fractions" 
                value={formData.topic}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={formData.subject} 
                  onValueChange={(val) => handleSelectChange("subject", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">Mathematics</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                    <SelectItem value="english">English / Language Arts</SelectItem>
                    <SelectItem value="computer-science">Computer Science</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Grade Level</Label>
                <Select 
                  value={formData.gradeLevel} 
                  onValueChange={(val) => handleSelectChange("gradeLevel", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elementary">Elementary School</SelectItem>
                    <SelectItem value="middle">Middle School</SelectItem>
                    <SelectItem value="high">High School</SelectItem>
                    <SelectItem value="college">College / University</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="questionCount">Number of Questions</Label>
                <Select 
                  value={formData.questionCount} 
                  onValueChange={(val) => handleSelectChange("questionCount", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="15">15 Questions</SelectItem>
                    <SelectItem value="20">20 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="questionType">Question Type</Label>
                <Select 
                  value={formData.questionType} 
                  onValueChange={(val) => handleSelectChange("questionType", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="true-false">True / False</SelectItem>
                    <SelectItem value="short-answer">Short Answer</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="additional-instructions">Additional Instructions (Optional)</Label>
              <Textarea 
                id="additional-instructions" 
                placeholder="Any specific focus areas or difficulty requirements?" 
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Generate Assessment
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
