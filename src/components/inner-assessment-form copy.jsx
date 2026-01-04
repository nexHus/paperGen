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
import toast from "react-hot-toast"

export function InnerAssessmentForm({
    className,
    initialData,
    onBack,
    ...props
}) {
    const [formData, setFormData] = useState({
        subject: initialData?.subject || '',
        assessmentType: initialData?.assessmentType || '',
        title: '',
        duration: '',
        passingPercentage: '',
        difficultyLevel: '',
        numberOfQuestions: '',
        marksPerQuestion: '',
        instructions: '',
        topicsCovered: ''
    });

    const [showQuestionDetails, setShowQuestionDetails] = useState(!!initialData?.assessmentType);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningData, setWarningData] = useState(null);

    const handleInputChange = (field, value) => {
        // Special handling for passing percentage to restrict range
        if (field === 'passingPercentage') {
            // Only allow numbers between 1-100
            const numValue = parseFloat(value);
            if (value === '' || (numValue >= 1 && numValue <= 100)) {
                setFormData(prev => ({
                    ...prev,
                    [field]: value
                }));
            }
            return;
        }
        
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAssessmentTypeChange = (value) => {
        handleInputChange('assessmentType', value);
        setShowQuestionDetails(value !== '');
    };

    const handlePercentageBlur = (e) => {
        const value = parseFloat(e.target.value);
        if (value < 1) {
            handleInputChange('passingPercentage', '1');
        } else if (value > 100) {
            handleInputChange('passingPercentage', '100');
        }
    };

    const proceedWithGeneration = async () => {
        setShowWarningModal(false);
        setIsGenerating(true);
        
        try {
            // Calculate total marks and passing marks
            const calculatedTotal = formData.numberOfQuestions && formData.marksPerQuestion 
                ? formData.numberOfQuestions * formData.marksPerQuestion 
                : 0;
                
            const calculatedPassingMarks = calculatedTotal > 0 
                ? Math.ceil((calculatedTotal * formData.passingPercentage) / 100)
                : 0;
            
            // Prepare topics as array
            const topicsArray = formData.topicsCovered
                ? formData.topicsCovered.split(',').map(t => t.trim()).filter(t => t)
                : [formData.subject]; // Use subject as default topic if none provided
            
            // First, try to generate questions using AI
            console.log('Generating AI questions...');
            toast.loading('Generating questions with AI...', { id: 'generating' });
            
            const aiResponse = await fetch('/api/assessment/generate-ai-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topics: topicsArray,
                    numberOfQuestions: parseInt(formData.numberOfQuestions) || 10,
                    assessmentType: formData.assessmentType,
                    difficulty: formData.difficultyLevel,
                    subject: formData.subject,
                    title: formData.title,
                    duration: parseInt(formData.duration) || 60,
                    marksPerQuestion: parseInt(formData.marksPerQuestion) || 1,
                    passingPercentage: parseInt(formData.passingPercentage) || 40,
                    useAI: true
                })
            });
            
            const aiResult = await aiResponse.json();
            toast.dismiss('generating');
            
            if (aiResult.type === 'success') {
                toast.success(`Assessment created with ${aiResult.data.totalQuestions} questions!`);
                console.log('Generated Assessment:', aiResult.data);
                
                // Reset form after successful creation
                setFormData({
                    subject: '',
                    assessmentType: '',
                    title: '',
                    duration: '',
                    passingPercentage: '',
                    difficultyLevel: '',
                    numberOfQuestions: '',
                    marksPerQuestion: '',
                    instructions: '',
                    topicsCovered: ''
                });
                // Go back to initial form
                if (onBack) onBack();
            } else {
                toast.error(aiResult.message || 'Failed to generate assessment');
            }
            
        } catch (error) {
            console.error('Error generating assessment:', error);
            toast.dismiss('generating');
            toast.error('Failed to generate assessment. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        const requiredFields = ['title', 'subject', 'assessmentType', 'duration', 'passingPercentage', 'difficultyLevel'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (showQuestionDetails) {
            requiredFields.push('numberOfQuestions', 'marksPerQuestion');
            const additionalMissing = ['numberOfQuestions', 'marksPerQuestion'].filter(field => !formData[field]);
            missingFields.push(...additionalMissing);
        }
        
        if (missingFields.length > 0) {
            alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }
        
        // Validate passing percentage
        if (formData.passingPercentage < 1 || formData.passingPercentage > 100) {
            alert('Passing percentage must be between 1 and 100');
            return;
        }
        
        // Validate duration vs number of questions
        if (showQuestionDetails && formData.numberOfQuestions && formData.duration) {
            const questionsPerMinute = formData.numberOfQuestions / formData.duration;
            const minTimePerQuestion = formData.duration / formData.numberOfQuestions;
            
            // Set minimum time based on assessment type
            let minRequiredTimePerQuestion = 1; // Default 1 minute per question
            
            switch (formData.assessmentType) {
                case 'mcqs':
                    minRequiredTimePerQuestion = 0.5; // 30 seconds per MCQ
                    break;
                case 'shortQuestions':
                    minRequiredTimePerQuestion = 2; // 2 minutes per short question
                    break;
                case 'longQuestions':
                    minRequiredTimePerQuestion = 5; // 5 minutes per long question
                    break;
                case 'fullPaper':
                    minRequiredTimePerQuestion = 3; // 3 minutes per question for full paper
                    break;
                case 'mixed':
                    minRequiredTimePerQuestion = 2; // 2 minutes per question for mixed
                    break;
            }
            
            // Check for warnings
            const warnings = [];
            
            if (minTimePerQuestion < minRequiredTimePerQuestion) {
                warnings.push({
                    type: 'duration',
                    severity: 'warning',
                    title: 'Duration Warning',
                    message: `Your duration seems too short for ${formData.assessmentType}!`,
                    details: [
                        `Current: ${minTimePerQuestion.toFixed(1)} minutes per question`,
                        `Recommended: At least ${minRequiredTimePerQuestion} minute(s) per question`,
                        `Suggested total duration: ${(formData.numberOfQuestions * minRequiredTimePerQuestion)} minutes`
                    ],
                    impact: 'This might make the assessment too rushed for students.'
                });
            }
            
            if (questionsPerMinute > 2) {
                warnings.push({
                    type: 'extreme',
                    severity: 'critical',
                    title: 'Extreme Warning',
                    message: `You have ${questionsPerMinute.toFixed(1)} questions per minute!`,
                    details: ['This is extremely unrealistic and may frustrate students.'],
                    impact: 'Students will likely not be able to complete the assessment properly.'
                });
            }
            
            // Show warning modal if there are any warnings
            if (warnings.length > 0) {
                setWarningData({
                    warnings,
                    assessmentType: formData.assessmentType,
                    timePerQuestion: minTimePerQuestion,
                    questionsPerMinute
                });
                setShowWarningModal(true);
                return; // Stop submission and show warning
            }
        }
        
        // If no warnings, proceed directly
        proceedWithGeneration();
    };

    return (
        <div className={cn("w-[50vw] flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Create New Assessment</CardTitle>
                    <CardDescription>
                        Configure your assessment details and question parameters
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            {/* Basic Assessment Info */}
                            <div className="grid gap-3">
                                <Label htmlFor="title">Assessment Title</Label>
                                <Input
                                    id="title"
                                    type="text"
                                    placeholder="Enter assessment title"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="subject">Subject</Label>
                                <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)} disabled={!!initialData?.subject}>
                                    <SelectTrigger className="w-[100%]">
                                        <SelectValue placeholder="Select a Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Select Subject</SelectLabel>
                                            <SelectItem value="cs">Computer Science</SelectItem>
                                            <SelectItem value="physics">Physics</SelectItem>
                                            <SelectItem value="chemistry">Chemistry</SelectItem>
                                            <SelectItem value="mathematics">Mathematics</SelectItem>
                                            <SelectItem value="biology">Biology</SelectItem>
                                            <SelectItem value="english">English</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="assessmentType">Assessment Type</Label>
                                <Select value={formData.assessmentType} onValueChange={handleAssessmentTypeChange} disabled={!!initialData?.assessmentType}>
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

                            {/* Assessment Parameters */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="duration">Duration (minutes)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        placeholder="e.g., 60"
                                        value={formData.duration}
                                        onChange={(e) => handleInputChange('duration', e.target.value)}
                                        min="1"
                                        required
                                    />
                                </div>
                                
                            <div className="grid gap-3">
                                <Label htmlFor="difficulty">Difficulty Level</Label>
                                <Select onValueChange={(value) => handleInputChange('difficultyLevel', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Difficulty Level</SelectLabel>
                                            <SelectItem value="Easy">Easy</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Hard">Hard</SelectItem>
                                            <SelectItem value="Mixed">Mixed</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            </div>

                            {/* Marks Configuration */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="passingPercentage">Passing Percentage (%)</Label>
                                    <Input
                                        id="passingPercentage"
                                        type="number"
                                        placeholder="e.g., 40 (for 40%)"
                                        value={formData.passingPercentage}
                                        onChange={(e) => handleInputChange('passingPercentage', e.target.value)}
                                        onBlur={handlePercentageBlur}
                                        min="1"
                                        max="100"
                                        step="1"
                                        required
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        Enter the minimum percentage required to pass (1-100%)
                                    </span>
                                </div>
                            </div>

                            {/* Question Configuration - Show only when assessment type is selected */}
                            {showQuestionDetails && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-3">
                                            <Label htmlFor="numberOfQuestions">Number of Questions</Label>
                                            <Input
                                                id="numberOfQuestions"
                                                type="number"
                                                placeholder="e.g., 20"
                                                value={formData.numberOfQuestions}
                                                onChange={(e) => handleInputChange('numberOfQuestions', e.target.value)}
                                                min="1"
                                                required
                                            />
                                        </div>
                                        
                                        <div className="grid gap-3">
                                            <Label htmlFor="marksPerQuestion">Marks per Question</Label>
                                            <Input
                                                id="marksPerQuestion"
                                                type="number"
                                                placeholder="e.g., 5"
                                                value={formData.marksPerQuestion}
                                                onChange={(e) => handleInputChange('marksPerQuestion', e.target.value)}
                                                min="0.5"
                                                step="0.5"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <Label htmlFor="topics">Topics to Cover</Label>
                                        <Input
                                            id="topics"
                                            type="text"
                                            placeholder="e.g., Arrays, Loops, Functions (comma separated)"
                                            value={formData.topicsCovered}
                                            onChange={(e) => handleInputChange('topicsCovered', e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Instructions */}
                            <div className="grid gap-3">
                                <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                                <textarea
                                    id="instructions"
                                    className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Enter any special instructions for the assessment..."
                                    value={formData.instructions}
                                    onChange={(e) => handleInputChange('instructions', e.target.value)}
                                />
                            </div>

                            {/* Calculated Values Display */}
                            {formData.numberOfQuestions && formData.marksPerQuestion && (
                                <div className="p-4 bg-muted rounded-md">
                                    <h4 className="font-semibold mb-2">Assessment Summary:</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span>Total Questions: {formData.numberOfQuestions}</span>
                                        <span>Marks per Question: {formData.marksPerQuestion}</span>
                                        <span className="font-semibold text-primary">Total Marks: {formData.numberOfQuestions * formData.marksPerQuestion}</span>
                                        <span>Expected Duration: {formData.duration} minutes</span>
                                        {formData.passingPercentage && (
                                            <>
                                                <span className="text-muted-foreground">
                                                    Passing Percentage: {formData.passingPercentage}%
                                                </span>
                                                <span className="font-medium text-green-600">
                                                    Passing Marks: {Math.ceil((formData.numberOfQuestions * formData.marksPerQuestion * formData.passingPercentage) / 100)}
                                                </span>
                                            </>
                                        )}
                                        {formData.duration && (
                                            <span className="col-span-2 text-muted-foreground">
                                                Time per Question: {(formData.duration / formData.numberOfQuestions).toFixed(1)} minutes
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Duration Warning */}
                                    {formData.duration && formData.numberOfQuestions && (() => {
                                        const timePerQuestion = formData.duration / formData.numberOfQuestions;
                                        let minRequired = 1;
                                        
                                        switch (formData.assessmentType) {
                                            case 'mcqs': minRequired = 0.5; break;
                                            case 'shortQuestions': minRequired = 2; break;
                                            case 'longQuestions': minRequired = 5; break;
                                            case 'fullPaper': minRequired = 3; break;
                                            case 'mixed': minRequired = 2; break;
                                        }
                                        
                                        if (timePerQuestion < minRequired) {
                                            return (
                                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-red-600 font-medium">⚠️ Duration Warning:</span>
                                                    </div>
                                                    <p className="text-red-600 text-sm mt-1">
                                                        Too little time per question! For {formData.assessmentType}, recommend at least {minRequired} minute(s) per question.
                                                        <br />
                                                        <strong>Suggested duration: {Math.ceil(formData.numberOfQuestions * minRequired)} minutes</strong>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        
                                        if (timePerQuestion > minRequired * 3) {
                                            return (
                                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-blue-600 font-medium">💡 Tip:</span>
                                                    </div>
                                                    <p className="text-blue-600 text-sm mt-1">
                                                        You have plenty of time per question ({timePerQuestion.toFixed(1)} minutes each). Consider adding more questions or reducing duration.
                                                    </p>
                                                </div>
                                            );
                                        }
                                        
                                        return null;
                                    })()}
                                </div>
                            )}

                            <div className="flex flex-col gap-3 mt-6">
                                <div className="flex gap-3">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="flex-1"
                                        onClick={onBack}
                                        disabled={isGenerating}
                                    >
                                        Back
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        className="flex-1"
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? 'Generating...' : 'Generate Assessment'}
                                    </Button>
                                </div>
                                {isGenerating && (
                                    <div className="text-center text-sm text-muted-foreground mt-2">
                                        Please wait while we generate your assessment...
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
            
            {/* Warning Modal */}
            {showWarningModal && warningData && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50">
                    <Card className="max-w-md mx-4 shadow-2xl border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                ⚠️ Assessment Configuration Warning
                            </CardTitle>
                            <CardDescription>
                                Please review the following concerns about your assessment settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {warningData.warnings.map((warning, index) => (
                                    <div 
                                        key={index}
                                        className={`p-3 rounded-md border ${
                                            warning.severity === 'critical' 
                                                ? 'bg-red-50 border-red-200' 
                                                : 'bg-yellow-50 border-yellow-200'
                                        }`}
                                    >
                                        <h4 className={`font-medium ${
                                            warning.severity === 'critical' 
                                                ? 'text-red-800' 
                                                : 'text-yellow-800'
                                        }`}>
                                            {warning.title}
                                        </h4>
                                        <p className={`text-sm mt-1 ${
                                            warning.severity === 'critical' 
                                                ? 'text-red-700' 
                                                : 'text-yellow-700'
                                        }`}>
                                            {warning.message}
                                        </p>
                                        <ul className={`text-xs mt-2 list-disc list-inside space-y-1 ${
                                            warning.severity === 'critical' 
                                                ? 'text-red-600' 
                                                : 'text-yellow-600'
                                        }`}>
                                            {warning.details.map((detail, i) => (
                                                <li key={i}>{detail}</li>
                                            ))}
                                        </ul>
                                        <p className={`text-xs mt-2 font-medium ${
                                            warning.severity === 'critical' 
                                                ? 'text-red-800' 
                                                : 'text-yellow-800'
                                        }`}>
                                            Impact: {warning.impact}
                                        </p>
                                    </div>
                                ))}
                                
                                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                                    <h4 className="font-medium text-blue-800">Recommendation</h4>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Consider adjusting your settings for a better student experience, or proceed if you have specific requirements.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                                <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => setShowWarningModal(false)}
                                >
                                    Go Back & Adjust
                                </Button>
                                <Button 
                                    className="flex-1"
                                    onClick={proceedWithGeneration}
                                >
                                    Proceed Anyway
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
