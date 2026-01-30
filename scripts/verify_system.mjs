
import { ChromaClient } from 'chromadb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Load .env.local manually
const envPath = path.join(rootDir, '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) return;
        
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[match[1].trim()] = match[2].trim();
        }
    });
}

console.log("Debug: Loaded keys:", Object.keys(env)); // Debug print


const FLASK_URL = env.FLASK_EMBEDDING_API_URL || "http://localhost:5000";
const CHROMA_URL = env.CHROMA_DB_URL || "http://localhost:8000";
const GEMINI_KEY = env.GEMINI_API_KEY;

console.log("🔍 Starting System Verification...");
console.log("--------------------------------");

async function testFlask() {
    console.log(`\n1️⃣  Testing Flask Embedding API at ${FLASK_URL}...`);
    try {
        const res = await fetch(`${FLASK_URL}/health`);
        if (res.ok) {
            const data = await res.json();
            console.log("   ✅ Flask API is UP");
            console.log(`   ℹ️  Model: ${data.model}`);
            return true;
        } else {
            console.log(`   ❌ Flask API returned status: ${res.status}`);
            return false;
        }
    } catch (e) {
        console.log(`   ❌ Flask API connection failed: ${e.message}`);
        return false;
    }
}

async function testChroma() {
    console.log(`\n2️⃣  Testing ChromaDB at ${CHROMA_URL}...`);
    try {
        const client = new ChromaClient({ path: CHROMA_URL });
        const heartbeat = await client.heartbeat();
        console.log(`   ✅ ChromaDB is UP (Heartbeat: ${heartbeat})`);
        
        // Test collection access
        try {
            const collection = await client.getOrCreateCollection({
                name: "test_verification_collection"
            });
            console.log("   ✅ ChromaDB Collection access working");
            await client.deleteCollection({name: "test_verification_collection"});
        } catch (e) {
            console.log(`   ⚠️  ChromaDB Collection test failed: ${e.message}`);
        }
        return true;
    } catch (e) {
        console.log(`   ❌ ChromaDB connection failed: ${e.message}`);
        return false;
    }
}

async function testGemini() {
    console.log(`\n3️⃣  Testing Gemini API Key...`);
    if (!GEMINI_KEY) {
        console.log("   ❌ GEMINI_API_KEY not found in .env.local");
        return false;
    }

    try {
        // First, list available models to debug
        console.log("   ℹ️  Checking available models...");
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`);
        if (listRes.ok) {
            const listData = await listRes.json();
            const modelNames = listData.models.map(m => m.name);
            console.log("   ℹ️  Available models:", modelNames.filter(n => n.includes('gemini')));
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello, are you working?" }] }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                console.log("   ✅ Gemini API is working");
                return true;
            } else {
                console.log("   ⚠️  Gemini API returned unexpected format");
                return false;
            }
        } else {
            const err = await response.text();
            console.log(`   ❌ Gemini API failed: ${response.status} - ${err}`);
            return false;
        }
    } catch (e) {
        console.log(`   ❌ Gemini API connection failed: ${e.message}`);
        return false;
    }
}

async function run() {
    const flaskOk = await testFlask();
    const chromaOk = await testChroma();
    const geminiOk = await testGemini();

    console.log("\n--------------------------------");
    if (flaskOk && chromaOk && geminiOk) {
        console.log("✅ ALL SYSTEMS GO! The backend is fully operational.");
    } else {
        console.log("⚠️  Some systems are not working correctly. Check logs above.");
    }
}

run();
