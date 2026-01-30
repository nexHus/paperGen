
import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
import { ChromaClient } from 'chromadb';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3000';
const CHROMA_URL = 'http://localhost:8000';

async function runTest() {
    console.log("🚀 Starting Full Workflow Test...");
    console.log("--------------------------------");

    // 1. Create a Dummy PDF
    console.log("\n1️⃣  Creating test PDF with unique content...");
    const doc = new jsPDF();
    // Unique content to verify retrieval
    const uniqueContent = `The Secret City of Elonville is located on the dark side of the Moon. 
    It was built by the Galactic Federation in 2050. 
    The key resource mined there is Lunarium, which powers warp drives.`;
    
    doc.text(uniqueContent, 10, 10);
    
    const pdfPath = path.join(__dirname, 'test_elonville.pdf');
    const pdfArrayBuffer = doc.output('arraybuffer');
    fs.writeFileSync(pdfPath, Buffer.from(pdfArrayBuffer));
    console.log("   ✅ PDF created: test_elonville.pdf");

    // 2. Upload PDF
    console.log("\n2️⃣  Uploading PDF to API...");
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(pdfPath);
    const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', fileBlob, 'test_elonville.pdf');

    let uploadData;
    try {
        const res = await fetch(`${API_URL}/api/curriculum/uploadFile`, {
            method: 'POST',
            body: formData
        });
        
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Upload failed: ${res.status} ${res.statusText} - ${text}`);
        }
        const json = await res.json();
        uploadData = json.data;
        console.log("   ✅ Upload successful!");
        console.log(`   ℹ️  Document ID: ${uploadData.documentId}`);
        console.log(`   ℹ️  Chroma Enabled: ${uploadData.chromaEnabled}`);
    } catch (e) {
        console.error("   ❌ Upload error:", e.message);
        return;
    }

    // 3. Add Curriculum Record
    console.log("\n3️⃣  Registering Curriculum in MongoDB...");
    let curriculumId;
    try {
        const res = await fetch(`${API_URL}/api/curriculum/add-curriculum`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Moon History",
                subject: "History",
                grade: "12",
                board: "Galactic",
                bookTitle: "Secrets of Space",
                numberOfChapters: 1,
                topics: ["Elonville", "Lunarium"],
                ...uploadData
            })
        });
        
        if (!res.ok) throw new Error(`Add Curriculum failed: ${res.status}`);
        const json = await res.json();
        curriculumId = json.curriculum._id;
        console.log("   ✅ Curriculum registered!");
        console.log(`   ℹ️  Curriculum ID: ${curriculumId}`);
    } catch (e) {
        console.error("   ❌ Add Curriculum error:", e.message);
        return;
    }

    // 4. Verify ChromaDB Storage
    console.log("\n4️⃣  Verifying ChromaDB Storage...");
    try {
        const client = new ChromaClient({ path: CHROMA_URL });
        // Note: Collection name must match what's in .env.local or default
        const collection = await client.getCollection({ name: "curriculum_documents" });
        const results = await collection.get({
            where: { documentId: uploadData.documentId }
        });
        
        if (results.ids.length > 0) {
            console.log(`   ✅ Found ${results.ids.length} chunks in ChromaDB for this document.`);
            console.log(`   ℹ️  Chunk preview: ${results.documents[0].substring(0, 50)}...`);
        } else {
            console.error("   ❌ No chunks found in ChromaDB! Embedding might have failed.");
        }
    } catch (e) {
        console.error("   ❌ ChromaDB verification failed:", e.message);
    }

    // 5. Generate Assessment
    console.log("\n5️⃣  Generating Assessment (Testing Retrieval & AI)...");
    try {
        const res = await fetch(`${API_URL}/api/assessment/generate-ai-questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topics: ["Elonville"],
                numberOfQuestions: 3,
                assessmentType: "mcqs",
                difficulty: "Easy",
                curriculumId: curriculumId,
                useAI: true
            })
        });

        if (!res.ok) throw new Error(`Generation failed: ${res.status}`);
        const json = await res.json();
        
        console.log("   ✅ Assessment Generated!");
        console.log(`   ℹ️  Generation Method: ${json.data.generationMethod}`);
        
        // Check content relevance
        const questionsJson = JSON.stringify(json.data.questions);
        const hasRelevantKeywords = questionsJson.includes("Lunarium") || questionsJson.includes("Moon") || questionsJson.includes("Galactic");
        
        if (hasRelevantKeywords) {
            console.log("   ✅ SUCCESS: Questions contain relevant context from the PDF!");
        } else {
            console.log("   ⚠️  WARNING: Questions might be generic. Check content below:");
        }
        
        console.log("\n   📝 Sample Question:");
        if (json.data.questions && json.data.questions.length > 0) {
            console.log(`   Q: ${json.data.questions[0].question}`);
            console.log(`   A: ${json.data.questions[0].options ? json.data.questions[0].options.join(', ') : 'N/A'}`);
        }

    } catch (e) {
        console.error("   ❌ Assessment generation error:", e.message);
    }

    // Cleanup
    try {
        fs.unlinkSync(pdfPath);
    } catch (e) {}
    
    console.log("\n--------------------------------");
    console.log("Test Complete.");
}

runTest();
