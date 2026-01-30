"use client"

import { useState } from "react"
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function NewAssessmentForm({
    className,
    onSubmit,
    ...props
}) {
    const [formData, setFormData] = useState({
        assessmentType: ''
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.assessmentType) {
            onSubmit?.(formData);
        }
    };

    return (
        <div className={cn("w-[50vw] flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>New Assessment</CardTitle>
                    <CardDescription>
                        Select the assessment type to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="assessmentType">Assessment Type</Label>
                                <Select onValueChange={(value) => handleInputChange('assessmentType', value)}>
                                    <SelectTrigger className="w-[100%]">
                                        <SelectValue placeholder="Select Assessment Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Select Assessment Type</SelectLabel>
                                            <SelectItem value="fullPaper">Full Paper</SelectItem>
                                            <SelectItem value="mcqs">Multiple Choice Questions</SelectItem>
                                            <SelectItem value="shortQuestions">Short Questions</SelectItem>
                                            <SelectItem value="longQuestions">Long Questions</SelectItem>
                                            <SelectItem value="mixed">Mixed (MCQs + Written)</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                <Button 
                                    type="submit" 
                                    className="w-full"
                                    disabled={!formData.assessmentType}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
