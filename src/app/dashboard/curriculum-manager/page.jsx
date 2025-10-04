"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { storage } from '@/firebase/firebaseStorage'
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
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
import { Badge } from "@/components/ui/badge"
import { 
    Plus, 
    Upload, 
    BookOpen, 
    FileText, 
    Edit, 
    Trash2, 
    Download,
    Search,
    Filter
} from "lucide-react"
import toast from "react-hot-toast"

export default function CurriculumManager() {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [fileUrl, setFileUrl] = useState("")

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)


    const [curricula, setCurricula] = useState([]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCurriculum, setEditingCurriculum] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterGrade, setFilterGrade] = useState("all");
    const [filterSubject, setFilterSubject] = useState("all");
    
    const [formData, setFormData] = useState({
        name: "",
        subject: "",
        grade: "",
        board: "",
        bookTitle: "",
        author: "",
        publisher: "",
        edition: "",
        numberOfChapters: "",
        topics: "",
        file: null
    });

     // Fetch curricula on component mount
     useEffect(() => {
        fetchCurricula();
    }, []);

    const fetchCurricula = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // const token = localStorage.getItem("token");
            // if (!token) {
            //     throw new Error("No authentication token found");
            // }

            const response = await fetch('/api/curriculum/get-curriculums', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

         console.log(response);

            const data = await response.json();
            if (data.type == "success") {
                setCurricula(data.curriculums);
            }
            else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error('Error fetching curricula:', error);
            setError(error.message);
            setCurricula([]);
        } finally {
            setIsLoading(false);
        }
    };


    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

   
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type and size
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload only PDF, DOC, or DOCX files');
            return;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            alert('File size should be less than 50MB');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Create a unique filename
            const timestamp = Date.now();
            const fileName = `curriculum_${timestamp}_${file.name}`;
            const storageRef = ref(storage, `papergenie/${fileName}`);

            // Upload file to Firebase Storage
            // const snapshot = await uploadBytes(storageRef, file);
            // const downloadURL = await getDownloadURL(snapshot.ref);

            // Update form data with file info and URL
            setFormData(prev => ({
                ...prev,
                file: file,
                fileUrl: downloadURL
            }));
            setFileUrl(downloadURL);

            console.log('File uploaded successfully:', downloadURL);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        const requiredFields = ['name', 'subject', 'grade', 'board', 'bookTitle'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
            alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        const topicsArray = formData.topics.split(',').map(topic => topic.trim()).filter(topic => topic);
        
        const curriculumData = {
            name: formData.name,
            subject: formData.subject,
            grade: formData.grade,
            board: formData.board,
            bookTitle: formData.bookTitle,
            author: formData.author || "Not specified",
            publisher: formData.publisher || "Not specified",
            edition: formData.edition || "Latest",
            numberOfChapters: parseInt(formData.chapters) || 0,
            topics: topicsArray
            // fileName: formData.file ? formData.file.name : "",
            // fileType: formData.file ? (formData.file.type.includes('pdf') ? 'PDF' : 'Document') : 'PDF',
            // fileSize: formData.file ? `${(formData.file.size / (1024 * 1024)).toFixed(1)} MB` : "N/A",
            // status: "Active"
        };

        try {
            setIsUploading(true);
            const token = localStorage.getItem("token");
       
            if (editingCurriculum) {
               // Update existing curriculum
            const response = await fetch(`/api/curriculum/update-curriculum`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...curriculumData,
                    curriculumId: editingCurriculum._id,
                    fileUrl: editingCurriculum.file
                }),
            });

            const result = await response.json();
            
            if (result.type === "success") {
                setCurricula(prev => prev.map(curr => 
                    curr._id === editingCurriculum._id ? result.curriculum : curr
                ));
                toast.success('Curriculum updated successfully!');
            } else {
                toast.error(result.message);
                return;
            }
            } else {
                // Add new curriculum
                const response = await fetch('/api/curriculum/add-curriculum', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({...curriculumData, file: fileUrl}),
                });

                if (!response.ok) {
                    throw new Error('Failed to add curriculum');
                }

                const newCurriculum = await response.json();
                setCurricula(prev => [...prev, { ...newCurriculum, id: Date.now() }]);
            }

            // Reset form
            setFormData({
                name: "",
                subject: "",
                grade: "",
                board: "",
                bookTitle: "",
                author: "",
                publisher: "",
                edition: "",
                numberOfChapters: "",
                topics: "",
                file: null
            });
            setFileUrl("");
            setShowAddForm(false);
            setEditingCurriculum(null);

            alert(editingCurriculum ? 'Curriculum updated successfully!' : 'Curriculum added successfully!');
        } catch (error) {
            console.error('Error saving curriculum:', error);
            alert('Failed to save curriculum. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleEdit = (curriculum) => {
        setFormData({
            name: curriculum.name,
            subject: curriculum.subject,
            grade: curriculum.grade,
            board: curriculum.board,
            bookTitle: curriculum.bookTitle,
            author: curriculum.author,
            publisher: curriculum.publisher,
            edition: curriculum.edition,
            numberOfChapters: curriculum.numberOfChapters.toString(),
            topics: curriculum.topics.join(', '),
            file: null // File will not be editable, just the URL
        });
        setEditingCurriculum(curriculum);
        setShowAddForm(true);
    };

    const handleDelete = async (curriculum) => {
        if (!confirm("Are you sure you want to delete this curriculum?")) {
            return;
        }
    
        try {
            toast.loading('Deleting curriculum...');
            const token = localStorage.getItem("token");
            const response = await fetch('/api/curriculum/delete-curriculum', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    curriculumId: curriculum._id
                })
            });
    
            const result = await response.json();
            toast.dismiss();
            if (result.type === "success") {
                setCurricula(prev => prev.filter(curr => curr._id !== curriculum._id));
                toast.success('Curriculum deleted successfully!');
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Error deleting curriculum:', error);
            toast.error('Failed to delete curriculum. Please try again.');
        }
    };
    const filteredCurricula = curricula.filter(curriculum => {
        const matchesSearch = curriculum.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            curriculum.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            curriculum.bookTitle?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGrade = !filterGrade || filterGrade === 'all' || curriculum.grade === filterGrade;
        const matchesSubject = !filterSubject || filterSubject === 'all' || curriculum.subject === filterSubject;
        
        return matchesSearch && matchesGrade && matchesSubject;
    });

    const uniqueGrades = [...new Set(curricula.map(c => c.grade))].sort();
    const uniqueSubjects = [...new Set(curricula.map(c => c.subject))].sort();

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Curriculum Manager</h1>
                    <p className="text-muted-foreground">Manage and organize your curriculum resources</p>
                </div>
                <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Curriculum
                </Button>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search curricula..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={filterGrade} onValueChange={setFilterGrade}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="All Grades" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Grades</SelectItem>
                                {uniqueGrades.map(grade => (
                                    <SelectItem key={grade} value={grade}>Grade {grade}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterSubject} onValueChange={setFilterSubject}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Subjects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                {uniqueSubjects.map(subject => (
                                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50">
                    <Card className="max-w-4xl mx-4 shadow-2xl border-2 max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle>{editingCurriculum ? 'Edit Curriculum' : 'Add New Curriculum'}</CardTitle>
                            <CardDescription>
                                {editingCurriculum ? 'Update curriculum details' : 'Upload and configure new curriculum resources'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Curriculum Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., Computer Science Grade 12"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject *</Label>
                                        <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Subject" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Computer Science">Computer Science</SelectItem>
                                                <SelectItem value="Mathematics">Mathematics</SelectItem>
                                                <SelectItem value="Physics">Physics</SelectItem>
                                                <SelectItem value="Chemistry">Chemistry</SelectItem>
                                                <SelectItem value="Biology">Biology</SelectItem>
                                                <SelectItem value="English">English</SelectItem>
                                                <SelectItem value="History">History</SelectItem>
                                                <SelectItem value="Geography">Geography</SelectItem>
                                                <SelectItem value="Economics">Economics</SelectItem>
                                                <SelectItem value="Business Studies">Business Studies</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="grade">Grade *</Label>
                                        <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Grade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[...Array(12)].map((_, i) => (
                                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                        Grade {i + 1}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="board">Board *</Label>
                                        <Select value={formData.board} onValueChange={(value) => handleInputChange('board', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Board" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CBSE">CBSE</SelectItem>
                                                <SelectItem value="NCERT">NCERT</SelectItem>
                                                <SelectItem value="ICSE">ICSE</SelectItem>
                                                <SelectItem value="State Board">State Board</SelectItem>
                                                <SelectItem value="IB">International Baccalaureate</SelectItem>
                                                <SelectItem value="Cambridge">Cambridge</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bookTitle">Book Title *</Label>
                                        <Input
                                            id="bookTitle"
                                            placeholder="e.g., Computer Science with Python"
                                            value={formData.bookTitle}
                                            onChange={(e) => handleInputChange('bookTitle', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="author">Author</Label>
                                        <Input
                                            id="author"
                                            placeholder="e.g., Sumita Arora"
                                            value={formData.author}
                                            onChange={(e) => handleInputChange('author', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="publisher">Publisher</Label>
                                        <Input
                                            id="publisher"
                                            placeholder="e.g., Dhanpat Rai"
                                            value={formData.publisher}
                                            onChange={(e) => handleInputChange('publisher', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edition">Edition</Label>
                                        <Input
                                            id="edition"
                                            placeholder="e.g., 2023-24"
                                            value={formData.edition}
                                            onChange={(e) => handleInputChange('edition', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="chapters">Number of Chapters</Label>
                                        <Input
                                            id="chapters"
                                            type="number"
                                            placeholder="e.g., 15"
                                            value={formData.numberOfChapters}
                                            onChange={(e) => handleInputChange('chapters', e.target.value)}
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="topics">Topics (comma separated)</Label>
                                    <textarea
                                        id="topics"
                                        className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        placeholder="e.g., Python Programming, Data Structures, Database Management"
                                        value={formData.topics}
                                        onChange={(e) => handleInputChange('topics', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                {
                                editingCurriculum ?'File Not Editable, to change file, you need to add new curriculum' : (
                                    <>
                                    <Label htmlFor="file">Upload Curriculum File</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            id="file"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileUpload}
                                            className="flex-1"
                                        />
                                        <Upload className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Supported formats: PDF, DOC, DOCX (Max 50MB)
                                    </p>
                                    </>
                                
                                )}
                                </div>

                                <div className="flex gap-3">
                                    <Button type="submit" className="flex-1">
                                        {editingCurriculum ? 'Update Curriculum' : 'Add Curriculum'}
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => {
                                            setShowAddForm(false);
                                            setEditingCurriculum(null);
                                            setFormData({
                                                name: "",
                                                subject: "",
                                                grade: "",
                                                board: "",
                                                bookTitle: "",
                                                author: "",
                                                publisher: "",
                                                edition: "",
                                                numberOfChapters: "",
                                                topics: "",
                                                file: null
                                            });
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {
                isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
                        <p className="ml-4 text-muted-foreground">Loading curriculum...</p>
                    </div>
                )
            }

            {/* Curricula Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCurricula.map((curriculum) => (
                    <Card key={curriculum._id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{curriculum.name}</CardTitle>
                                    <CardDescription className="mt-1">
                                        {curriculum.bookTitle}
                                    </CardDescription>
                                </div>
                                <Badge variant={curriculum.status === 'Active' ? 'default' : 'secondary'}>
                                    {curriculum.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{curriculum.subject} - Grade {curriculum.grade}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{curriculum.board} Board</span>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    <p><strong>Author:</strong> {curriculum.author}</p>
                                    <p><strong>Publisher:</strong> {curriculum.publisher}</p>
                                    <p><strong>Edition:</strong> {curriculum.edition}</p>
                                    <p><strong>Chapters:</strong> {curriculum.numberOfChapters}</p>
                                </div>

                                <div className="flex flex-wrap gap-1 mt-2">
                                    {curriculum.topics.slice(0, 3).map((topic, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                            {topic}
                                        </Badge>
                                    ))}
                                    {curriculum.topics.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{curriculum.topics.length - 3} more
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                    <span>{curriculum.fileType} • {curriculum.fileSize}</span>
                                    <span>Added {curriculum.uploadDate}</span>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleEdit(curriculum)}
                                        className="flex-1"
                                    >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <Download className="h-3 w-3 mr-1" />
                                        View
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="destructive"
                                        onClick={() => handleDelete(curriculum)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredCurricula.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No curricula found</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            {searchTerm || (filterGrade !== 'all') || (filterSubject !== 'all')
                                ? "No curricula match your current filters. Try adjusting your search criteria."
                                : "Get started by adding your first curriculum resource."
                            }
                        </p>
                        {!searchTerm && filterGrade === 'all' && filterSubject === 'all' && (
                            <Button onClick={() => setShowAddForm(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Curriculum
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Statistics */}
            {curricula.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Curriculum Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">{curricula.length}</div>
                                <div className="text-sm text-muted-foreground">Total Curricula</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">{uniqueSubjects.length}</div>
                                <div className="text-sm text-muted-foreground">Subjects</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">{uniqueGrades.length}</div>
                                <div className="text-sm text-muted-foreground">Grade Levels</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    {curricula.filter(c => c.status === 'Active').length}
                                </div>
                                <div className="text-sm text-muted-foreground">Active</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
