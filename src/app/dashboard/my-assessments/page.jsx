"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
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
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
    Download, 
    FileText, 
    Calendar, 
    Clock, 
    Users, 
    Target,
    ChevronDown,
    ChevronUp,
    Search,
    Filter,
    BookOpen,
    GraduationCap,
    Edit,
    Trash2,
    Eye,
    Share,
    Star,
    BarChart3,
    Plus,
    Loader2
} from "lucide-react"
import toast from "react-hot-toast"

import { generateAssessmentPDF } from "@/utils/pdfGenerator";

export default function MyAssessments() {
    const [assessments, setAssessments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterSubject, setFilterSubject] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [expandedAssessments, setExpandedAssessments] = useState(new Set());

    // Fetch assessments on component mount
    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/assessment/get-all-assessment', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.type === "success") {
                // Transform API data to match UI expectations
                const transformedAssessments = (data.assessment || []).map(assessment => ({
                    id: assessment._id,
                    title: assessment.assessmentTitle,
                    subject: assessment.subject,
                    grade: "N/A", // Not in schema, can be added later
                    board: "N/A", // Not in schema, can be added later
                    type: assessment.assessmentType || "General",
                    totalMarks: assessment.questionCount * assessment.marksPerQuestion || 0,
                    duration: assessment.duration || 0,
                    questions: assessment.questions || [], // Store the full questions array
                    questionCount: assessment.numberOfQuestions || 0, // Store the count separately
                    createdDate: new Date(assessment.createdAt).toLocaleDateString(),
                    status: "Published",
                    downloads: 0,
                    difficulty: assessment.difficultyLevel || assessment.difficulty || "Medium",
                    topics: assessment.topicsCovered || [],
                    description: `Assessment covering ${assessment.subject} with ${assessment.questionCount} questions.`,
                    passingPercentage: assessment.passingPercentage,
                    marksPerQuestion: assessment.marksPerQuestion,
                    assessmentFile: assessment.assessmentFile,
                    questionBreakdown: {
                        total: assessment.questionCount || 0
                    },
                    markingScheme: {
                        total: `${assessment.marksPerQuestion} marks each`
                    }
                }));
                setAssessments(transformedAssessments);
            } else {
                toast.error(data.message || "Failed to fetch assessments");
                setAssessments([]);
            }
        } catch (error) {
            console.error('Error fetching assessments:', error);
            setError(error.message);
            setAssessments([]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpanded = (id) => {
        const newExpanded = new Set(expandedAssessments);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedAssessments(newExpanded);
    };

    const handleDownload = (assessment) => {
        try {
            toast.loading("Generating PDF...", { id: "pdf-gen" });
            generateAssessmentPDF(assessment);
            toast.success("PDF downloaded successfully!", { id: "pdf-gen" });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF", { id: "pdf-gen" });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this assessment?")) {
            return;
        }
        
        try {
            const toastId = toast.loading('Deleting assessment...');
            
            const response = await fetch('/api/assessment/delete-assessment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ assessmentId: id })
            });

            const data = await response.json();
            
            if (data.type === "success") {
                setAssessments(prev => prev.filter(assessment => assessment.id !== id));
                toast.success('Assessment deleted successfully', { id: toastId });
            } else {
                toast.error(data.message || 'Failed to delete assessment', { id: toastId });
            }
        } catch (error) {
            console.error('Error deleting assessment:', error);
            toast.error('Failed to delete assessment');
        }
    };

    const filteredAssessments = assessments.filter(assessment => {
        const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            assessment.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            assessment.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesSubject = filterSubject === 'all' || assessment.subject === filterSubject;
        const matchesType = filterType === 'all' || assessment.type === filterType;
        const matchesStatus = filterStatus === 'all' || assessment.status === filterStatus;
        
        return matchesSearch && matchesSubject && matchesType && matchesStatus;
    });

    const uniqueSubjects = [...new Set(assessments.map(a => a.subject))].sort();
    const uniqueTypes = [...new Set(assessments.map(a => a.type))].sort();

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-100 text-green-800 border-green-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Hard': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Published': return 'bg-green-100 text-green-800 border-green-200';
            case 'Draft': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Archived': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)"
            }}
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            <div className="px-4 lg:px-6 space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-3xl font-bold tracking-tight">My Assessments</h1>
                                        <p className="text-muted-foreground">
                                            Manage and download your created assessments
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span>{assessments.length} Total</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4" />
                                            <span>{assessments.filter(a => a.status === 'Published').length} Published</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Loading State */}
                                {isLoading && (
                                    <Card>
                                        <CardContent className="flex flex-col items-center justify-center py-12">
                                            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">Loading Assessments</h3>
                                            <p className="text-muted-foreground text-center">
                                                Please wait while we fetch your assessments...
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Error State */}
                                {error && !isLoading && (
                                    <Card>
                                        <CardContent className="flex flex-col items-center justify-center py-12">
                                            <FileText className="h-12 w-12 text-destructive mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">Error Loading Assessments</h3>
                                            <p className="text-muted-foreground text-center mb-4">{error}</p>
                                            <Button onClick={fetchAssessments}>Try Again</Button>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Search and Filters - Only show when not loading and no error */}
                                {!isLoading && !error && (
                                <>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col lg:flex-row gap-4">
                                            <div className="flex-1">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search assessments..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <Select value={filterSubject} onValueChange={setFilterSubject}>
                                                    <SelectTrigger className="w-[160px]">
                                                        <BookOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                                                        <SelectValue placeholder="All Subjects" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Subjects</SelectItem>
                                                        {uniqueSubjects.map(subject => (
                                                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                
                                                <Select value={filterType} onValueChange={setFilterType}>
                                                    <SelectTrigger className="w-[140px]">
                                                        <GraduationCap className="w-4 h-4 mr-2 text-muted-foreground" />
                                                        <SelectValue placeholder="All Types" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Types</SelectItem>
                                                        {uniqueTypes.map(type => (
                                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                                    <SelectTrigger className="w-[140px]">
                                                        <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                                        <SelectValue placeholder="All Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        <SelectItem value="Published">Published</SelectItem>
                                                        <SelectItem value="Draft">Draft</SelectItem>
                                                        <SelectItem value="Archived">Archived</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Assessment List */}
                                <div className="space-y-4">
                                    {filteredAssessments.map((assessment) => (
                                        <Card key={assessment.id} className="hover:shadow-md transition-shadow">
                                            <CardHeader 
                                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => toggleExpanded(assessment.id)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-start gap-4 flex-1">
                                                        {/* Assessment Icon */}
                                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-primary" />
                                                        </div>
                                                        
                                                        {/* Assessment Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <CardTitle className="text-lg font-semibold">
                                                                    {assessment.title}
                                                                </CardTitle>
                                                                <Badge variant={assessment.status === 'Published' ? 'default' : 'secondary'}>
                                                                    {assessment.status}
                                                                </Badge>
                                                                <Badge variant="outline" className={getDifficultyColor(assessment.difficulty)}>
                                                                    {assessment.difficulty}
                                                                </Badge>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-2">
                                                                    <BookOpen className="w-4 h-4" />
                                                                    {assessment.subject} • Grade {assessment.grade}
                                                                </span>
                                                                <span className="flex items-center gap-2">
                                                                    <Target className="w-4 h-4" />
                                                                    {assessment.totalMarks} marks
                                                                </span>
                                                                <span className="flex items-center gap-2">
                                                                    <Clock className="w-4 h-4" />
                                                                    {assessment.duration} mins
                                                                </span>
                                                                <span className="flex items-center gap-2">
                                                                    <Users className="w-4 h-4" />
                                                                    {assessment.questionCount} questions
                                                                </span>
                                                                <span className="flex items-center gap-2">
                                                                    <Download className="w-4 h-4" />
                                                                    {assessment.downloads} downloads
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Action Buttons and Expand Arrow */}
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownload(assessment);
                                                            }}
                                                        >
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download
                                                        </Button>
                                                        
                                                        <div className="text-muted-foreground">
                                                            {expandedAssessments.has(assessment.id) ? 
                                                                <ChevronUp className="w-4 h-4" /> : 
                                                                <ChevronDown className="w-4 h-4" />
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            
                                            {/* Expanded Content */}
                                            {expandedAssessments.has(assessment.id) && (
                                                <CardContent className="pt-0 border-t">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                                        {/* Assessment Details */}
                                                        <div className="space-y-4">
                                                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                                                Assessment Details
                                                            </h4>
                                                            
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                                                                    <span className="text-sm font-medium">Board:</span>
                                                                    <span className="text-sm font-semibold">{assessment.board}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                                                                    <span className="text-sm font-medium">Type:</span>
                                                                    <span className="text-sm font-semibold">{assessment.type}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                                                                    <span className="text-sm font-medium">Created:</span>
                                                                    <span className="text-sm font-semibold">{assessment.createdDate}</span>
                                                                </div>
                                                            </div>

                                                            <div className="pt-2">
                                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                                    {assessment.description}
                                                                </p>
                                                            </div>

                                                            {/* Topics */}
                                                            <div>
                                                                <h5 className="text-sm font-semibold mb-2">Topics Covered:</h5>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {assessment.topics.map((topic, index) => (
                                                                        <Badge key={index} variant="outline" className="text-xs">
                                                                            {topic}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Question Breakdown */}
                                                        <div className="space-y-4">
                                                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                                                Question Breakdown
                                                            </h4>
                                                            
                                                            <div className="space-y-3">
                                                                {Object.entries(assessment.questionBreakdown).map(([type, count]) => (
                                                                    count > 0 && (
                                                                        <div key={type} className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg">
                                                                            <span className="text-sm font-medium capitalize">
                                                                                {type.replace(/([A-Z])/g, ' $1').trim()}:
                                                                            </span>
                                                                            <div className="text-right">
                                                                                <span className="text-sm font-bold">{count} questions</span>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    {assessment.markingScheme[type]}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                ))}
                                                            </div>

                                                            {/* Additional Actions */}
                                                            <div className="flex gap-2 pt-4">
                                                                <Button size="sm" variant="outline" className="flex-1">
                                                                    <Edit className="w-4 h-4 mr-2" />
                                                                    Edit
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="flex-1">
                                                                    <Share className="w-4 h-4 mr-2" />
                                                                    Share
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="flex-1">
                                                                    <Eye className="w-4 h-4 mr-2" />
                                                                    Preview
                                                                </Button>
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="destructive" 
                                                                    onClick={() => handleDelete(assessment.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            )}
                                        </Card>
                                    ))}
                                </div>

                                {/* Empty State */}
                                {filteredAssessments.length === 0 && (
                                    <Card>
                                        <CardContent className="flex flex-col items-center justify-center py-12">
                                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">No assessments found</h3>
                                            <p className="text-muted-foreground text-center mb-4">
                                                {searchTerm || filterSubject !== 'all' || filterType !== 'all' || filterStatus !== 'all'
                                                    ? "No assessments match your current filters. Try adjusting your search criteria."
                                                    : "Start creating assessments with our Generate Assessment tool to see them listed here."
                                                }
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Statistics */}
                                {assessments.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Assessment Statistics</CardTitle>
                                            <CardDescription>Overview of your assessment collection</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center p-4 border rounded-lg">
                                                    <div className="text-2xl font-bold text-primary mb-1">{assessments.length}</div>
                                                    <div className="text-sm text-muted-foreground">Total Created</div>
                                                </div>
                                                <div className="text-center p-4 border rounded-lg">
                                                    <div className="text-2xl font-bold text-primary mb-1">{assessments.filter(a => a.status === 'Published').length}</div>
                                                    <div className="text-sm text-muted-foreground">Published</div>
                                                </div>
                                                <div className="text-center p-4 border rounded-lg">
                                                    <div className="text-2xl font-bold text-primary mb-1">{assessments.reduce((sum, a) => sum + a.downloads, 0)}</div>
                                                    <div className="text-sm text-muted-foreground">Total Downloads</div>
                                                </div>
                                                <div className="text-center p-4 border rounded-lg">
                                                    <div className="text-2xl font-bold text-primary mb-1">{uniqueSubjects.length}</div>
                                                    <div className="text-sm text-muted-foreground">Subjects Covered</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
