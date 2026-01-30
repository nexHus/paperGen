/**
 * AI-Powered Question Generation API
 * Uses HuggingFace's free API or local fallback for generating questions
 * from curriculum content stored in ChromaDB
 */

import connectDB from "@/middlewares/connectDB";
import ChromaDBManager from "@/utils/chromaManager";
import Assessment from "@/models/Assessment";
import Curriculum from "@/models/Curriculum";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Google Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// HuggingFace API configuration (free tier)
const HF_API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-large";
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";

// OpenAI-compatible API (can use free alternatives like Together AI, Groq, etc.)
const OPENAI_COMPATIBLE_URL = process.env.OPENAI_COMPATIBLE_URL || "";
const OPENAI_COMPATIBLE_KEY = process.env.OPENAI_COMPATIBLE_KEY || "";

/**
 * Generate questions using Google Gemini API
 */
async function generateWithGemini(prompt, systemPrompt) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  // Use gemini-1.5-flash as it is the most up-to-date stable version available
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(systemPrompt + "\n\n" + prompt);
  const response = await result.response;
  return response.text();
}

/**
 * Generate questions using HuggingFace API
 */
async function generateWithHuggingFace(prompt) {
  if (!HF_API_KEY) {
    throw new Error("HuggingFace API key not configured");
  }

  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        do_sample: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace API error: ${error}`);
  }

  const result = await response.json();
  return result[0]?.generated_text || result.generated_text || "";
}

/**
 * Generate questions using OpenAI-compatible API (Groq, Together AI, etc.)
 */
async function generateWithOpenAICompatible(prompt, systemPrompt) {
  if (!OPENAI_COMPATIBLE_URL || !OPENAI_COMPATIBLE_KEY) {
    throw new Error("OpenAI-compatible API not configured");
  }

  const response = await fetch(OPENAI_COMPATIBLE_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_COMPATIBLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_COMPATIBLE_MODEL || "llama-3.1-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI-compatible API error: ${error}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || "";
}

/**
 * Generate questions locally using templates (fallback when no AI API available)
 */
function generateQuestionsLocally(content, config) {
  const { assessmentType, numberOfQuestions, difficulty, topics } = config;
  const questions = [];

  // Extract key sentences from content for question generation
  const sentences = content
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 300);

  const questionTemplates = {
    mcq: [
      "What is the main concept discussed in: '{sentence}'?",
      "According to the text, which of the following is true about '{keyword}'?",
      "Which statement best describes '{keyword}'?",
      "What is the purpose of '{keyword}' as mentioned in the curriculum?",
    ],
    shortAnswer: [
      "Explain the concept of '{keyword}' in your own words.",
      "Define '{keyword}' as described in the curriculum.",
      "What are the key characteristics of '{keyword}'?",
      "How does '{keyword}' relate to the broader topic?",
    ],
    longAnswer: [
      "Discuss in detail the importance of '{keyword}' and its applications.",
      "Analyze the relationship between different aspects of '{keyword}'.",
      "Evaluate the significance of '{keyword}' in the context of the subject.",
      "Compare and contrast different approaches to understanding '{keyword}'.",
    ],
  };

  // Extract keywords from content
  const keywords = extractKeywords(content, topics);

  // Determine question distribution based on assessment type
  let distribution = { mcq: 0, shortAnswer: 0, longAnswer: 0 };
  
  switch (assessmentType) {
    case 'mcqs':
      distribution = { mcq: numberOfQuestions, shortAnswer: 0, longAnswer: 0 };
      break;
    case 'shortQuestions':
      distribution = { mcq: 0, shortAnswer: numberOfQuestions, longAnswer: 0 };
      break;
    case 'longQuestions':
      distribution = { mcq: 0, shortAnswer: 0, longAnswer: numberOfQuestions };
      break;
    case 'fullPaper':
      distribution = {
        mcq: Math.ceil(numberOfQuestions * 0.4),
        shortAnswer: Math.ceil(numberOfQuestions * 0.35),
        longAnswer: Math.floor(numberOfQuestions * 0.25),
      };
      break;
    default: // mixed
      distribution = {
        mcq: Math.ceil(numberOfQuestions * 0.5),
        shortAnswer: Math.ceil(numberOfQuestions * 0.3),
        longAnswer: Math.floor(numberOfQuestions * 0.2),
      };
  }

  // Generate MCQs
  for (let i = 0; i < distribution.mcq; i++) {
    const keyword = keywords[i % keywords.length] || topics[0] || "the topic";
    const template = questionTemplates.mcq[i % questionTemplates.mcq.length];
    const sentence = sentences[i % sentences.length] || "";
    
    // Determine if the question asks for a keyword or a description
    const isKeywordAnswer = template.includes("main concept");
    
    let options = [];
    let correctAnswerIndex = 0;

    if (isKeywordAnswer) {
        // Question: What is the concept in "{sentence}"?
        // Answer: keyword
        // Distractors: other keywords
        const otherKeywords = keywords.filter(k => k !== keyword);
        const distractors = otherKeywords.sort(() => Math.random() - 0.5).slice(0, 3);
        
        // Fill with generic if not enough keywords
        while (distractors.length < 3) {
            distractors.push(`Concept ${distractors.length + 1}`);
        }
        
        options = [keyword, ...distractors];
    } else {
        // Question: Describe {keyword}?
        // Answer: sentence containing keyword
        // Distractors: sentences containing other keywords
        
        // Find a sentence containing the keyword for the correct answer
        const correctSentence = sentences.find(s => s.toLowerCase().includes(keyword.toLowerCase())) || 
                              `It is a key concept related to ${topics[0]}.`;
                              
        // Find sentences NOT containing the keyword for distractors
        const otherSentences = sentences
            .filter(s => !s.toLowerCase().includes(keyword.toLowerCase()) && s !== correctSentence)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
            
        // Fill with generic if not enough sentences
        while (otherSentences.length < 3) {
            otherSentences.push(`It is unrelated to ${keyword} but important for the subject.`);
        }
        
        options = [correctSentence, ...otherSentences];
    }

    // Shuffle options and find new correct index
    const shuffledOptions = options.map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
        
    correctAnswerIndex = shuffledOptions.indexOf(isKeywordAnswer ? keyword : options[0]);

    questions.push({
      id: `q_${i + 1}`,
      type: "MCQ",
      difficulty: difficulty,
      question: template.replace('{keyword}', keyword).replace('{sentence}', sentence.substring(0, 100) + "..."),
      options: shuffledOptions,
      correctAnswer: correctAnswerIndex,
      answer: shuffledOptions[correctAnswerIndex],
      marks: 1,
      topic: topics[i % topics.length] || "General",
    });
  }

  // Generate Short Answer Questions
  for (let i = 0; i < distribution.shortAnswer; i++) {
    const keyword = keywords[(i + distribution.mcq) % keywords.length] || topics[0] || "the topic";
    const template = questionTemplates.shortAnswer[i % questionTemplates.shortAnswer.length];
    
    questions.push({
      id: `q_${distribution.mcq + i + 1}`,
      type: "Short Answer",
      difficulty: difficulty,
      question: template.replace('{keyword}', keyword),
      expectedLength: "50-100 words",
      marks: 3,
      topic: topics[i % topics.length] || "General",
      rubric: `Award marks based on clarity, accuracy, and completeness of explanation about ${keyword}.`,
    });
  }

  // Generate Long Answer Questions
  for (let i = 0; i < distribution.longAnswer; i++) {
    const keyword = keywords[(i + distribution.mcq + distribution.shortAnswer) % keywords.length] || topics[0] || "the topic";
    const template = questionTemplates.longAnswer[i % questionTemplates.longAnswer.length];
    
    questions.push({
      id: `q_${distribution.mcq + distribution.shortAnswer + i + 1}`,
      type: "Long Answer",
      difficulty: difficulty,
      question: template.replace('{keyword}', keyword),
      expectedLength: "200-300 words",
      marks: 5,
      topic: topics[i % topics.length] || "General",
      rubric: `Evaluate based on: depth of analysis (40%), examples provided (30%), clarity of expression (20%), structure (10%).`,
    });
  }

  return questions;
}

/**
 * Extract keywords from content
 */
function extractKeywords(content, topics) {
  // Start with provided topics
  const keywords = [...topics];
  
  // Extract additional keywords using simple heuristics
  const words = content.split(/\s+/);
  const wordFreq = {};
  
  words.forEach(word => {
    const cleaned = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (cleaned.length > 4 && !['which', 'where', 'their', 'there', 'about', 'these', 'those', 'would', 'could', 'should'].includes(cleaned)) {
      wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
    }
  });

  // Sort by frequency and get top words
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  return [...new Set([...keywords, ...sortedWords])];
}

/**
 * Generate MCQ options
 */
function generateMCQOptions(keyword, content) {
  // Generate plausible but incorrect options
  const correctOption = `The correct definition/explanation of ${keyword}`;
  const distractors = [
    `An incorrect but plausible interpretation of ${keyword}`,
    `A common misconception about ${keyword}`,
    `A partially correct statement about ${keyword}`,
  ];
  
  const options = [correctOption, ...distractors];
  // Shuffle options
  return options.sort(() => Math.random() - 0.5);
}

/**
 * Format AI response into structured questions
 */
function parseAIResponse(aiResponse, assessmentType, numberOfQuestions) {
  const questions = [];
  
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(aiResponse);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, numberOfQuestions);
    }
    if (parsed.questions && Array.isArray(parsed.questions)) {
      return parsed.questions.slice(0, numberOfQuestions);
    }
  } catch (e) {
    // Parse as text if not JSON
    const lines = aiResponse.split('\n').filter(line => line.trim());
    let currentQuestion = null;
    
    lines.forEach((line, index) => {
      // Look for question patterns
      const questionMatch = line.match(/^(\d+[\.\)]\s*|Q\d*[\.\):]?\s*|Question\s*\d*[\.\):]?\s*)/i);
      
      if (questionMatch) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          id: `q_${questions.length + 1}`,
          type: assessmentType === 'mcqs' ? 'MCQ' : assessmentType === 'shortQuestions' ? 'Short Answer' : 'Long Answer',
          question: line.replace(questionMatch[0], '').trim(),
          marks: assessmentType === 'mcqs' ? 1 : assessmentType === 'shortQuestions' ? 3 : 5,
          options: assessmentType === 'mcqs' ? [] : undefined,
        };
      } else if (currentQuestion && assessmentType === 'mcqs') {
        // Look for MCQ options
        const optionMatch = line.match(/^([A-Da-d][\.\)]\s*)/);
        if (optionMatch) {
          currentQuestion.options = currentQuestion.options || [];
          currentQuestion.options.push(line.replace(optionMatch[0], '').trim());
        }
      }
    });
    
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
  }
  
  return questions.slice(0, numberOfQuestions);
}

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      type: "error",
      message: "Method Not Allowed",
    });
  }

  try {
    const {
      topics,
      numberOfQuestions = 10,
      assessmentType = 'mixed',
      difficulty = 'Medium',
      subject = 'General',
      title = `Assessment - ${new Date().toLocaleDateString()}`,
      duration = 60,
      marksPerQuestion = 1,
      passingPercentage = 40,
      useAI = true, // Whether to use AI APIs or local generation
      curriculumId = null, // Optional: Restrict search to specific curriculum
    } = req.body;

    // Validate required fields
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        type: "error",
        message: "topics array is required and must not be empty",
      });
    }

    // Validate numeric fields
    const numQuestions = parseInt(numberOfQuestions) || 10;
    const numDuration = parseInt(duration) || 60;
    const numMarks = parseInt(marksPerQuestion) || 1;
    const numPassing = Math.min(100, Math.max(0, parseInt(passingPercentage) || 40));

    if (numQuestions < 1 || numQuestions > 100) {
      return res.status(400).json({
        type: "error",
        message: "numberOfQuestions must be between 1 and 100",
      });
    }

    // Step 1: Search ChromaDB for relevant content (with graceful fallback)
    console.log("Searching ChromaDB for relevant content...");
    let relevantContent = [];
    let chromaAvailable = false;
    let fallbackContent = "";

    try {
      const chromaManager = new ChromaDBManager();
      chromaAvailable = await chromaManager.checkConnection();

      if (chromaAvailable) {
        // If curriculumId is provided, fetch its publicId first to filter chunks
        let searchFilter = null;
        
        if (curriculumId && curriculumId !== 'none') {
           // We need to find the publicId (documentId in Chroma) associated with this curriculumId
           try {
             // Validate if curriculumId is a valid ObjectId
             if (curriculumId.match(/^[0-9a-fA-F]{24}$/)) {
                const curriculumDoc = await Curriculum.findById(curriculumId);
                if (curriculumDoc) {
                  if (curriculumDoc.publicId) {
                    searchFilter = { documentId: curriculumDoc.publicId };
                    console.log(`Filtering search for curriculum: ${curriculumDoc.name} (${curriculumDoc.publicId})`);
                  }
                  // Store text content as fallback
                  if (curriculumDoc.textContent) {
                    fallbackContent = curriculumDoc.textContent;
                  }
                } else {
                    console.warn(`Curriculum not found: ${curriculumId}`);
                }
             } else {
                 console.warn(`Invalid curriculumId format: ${curriculumId}`);
             }
           } catch (err) {
             console.warn("Could not find curriculum for filtering:", err);
           }
        }

        for (const topic of topics) {
          try {
            console.log(`Searching ChromaDB for topic: "${topic}" with filter:`, searchFilter);
            // Increased search results from 5 to 15 to get more context
            const searchResults = await chromaManager.search(topic, 15, searchFilter);
            
            if (searchResults.documents && searchResults.documents[0] && searchResults.documents[0].length > 0) {
              console.log(`Search results for "${topic}":`, searchResults.documents[0].length, "documents found");
              // Log a snippet of the first result to verify relevance
              console.log(`Snippet for "${topic}":`, searchResults.documents[0][0].substring(0, 100) + "...");
              relevantContent.push(...searchResults.documents[0]);
            } else {
              console.log(`No results found for topic: "${topic}"`);
            }
          } catch (searchError) {
            console.error(`Error searching for topic "${topic}":`, searchError.message);
          }
        }
      } else {
        console.log("ChromaDB not available, proceeding with local generation only");
        // Try to get fallback content even if Chroma is down
        if (curriculumId && curriculumId !== 'none' && curriculumId.match(/^[0-9a-fA-F]{24}$/)) {
            try {
                const curriculumDoc = await Curriculum.findById(curriculumId);
                if (curriculumDoc && curriculumDoc.textContent) {
                    fallbackContent = curriculumDoc.textContent;
                    console.log("Using fallback content from MongoDB");
                }
            } catch (e) { console.error("Error fetching fallback content:", e); }
        }
      }
    } catch (chromaError) {
      console.error("ChromaDB connection error:", chromaError.message);
      // Continue without ChromaDB - will use local generation
    }

    // Combine all relevant content
    let combinedContent = relevantContent.join('\n\n');
    
    // Use fallback content if no relevant content found from ChromaDB
    if ((!combinedContent || combinedContent.length < 100) && fallbackContent) {
        console.log("Using fallback content from MongoDB as ChromaDB search yielded insufficient results.");
        combinedContent = fallbackContent;
    }

    console.log(`Total relevant content length: ${combinedContent.length} characters`);

    if (!combinedContent || combinedContent.length < 100) {
      // Generate questions without curriculum content (use topics only)
      console.log("No curriculum content found, generating generic questions based on topics...");
    }

    // Step 2: Generate questions
    let questions = [];
    let generationMethod = "local";

    if (useAI && combinedContent.length > 100) {
      // Build prompt for AI
      const systemPrompt = `You are an expert educator creating assessment questions. Generate high-quality, well-structured ${assessmentType} questions based on the provided curriculum content. 
      
Rules:
- Create exactly ${numberOfQuestions} questions
- Difficulty level: ${difficulty}
- **Question Structure:**
  - Questions must be clear, concise, and grammatically correct.
  - Avoid ambiguous phrasing.
  - Ensure the question stem provides enough context to answer without looking at the options first.
- **For MCQs:**
  - Provide exactly 4 options.
  - One option must be the correct answer.
  - The other three options must be **highly relevant and plausible distractors** directly related to the specific concept being tested.
  - **CRITICAL:** Distractors must be conceptually similar to the correct answer (e.g., if the answer is a specific algorithm, distractors must be other real algorithms, not random words).
  - Do NOT use "None of the above" or "All of the above".
  - Ensure distractors are not obviously incorrect or irrelevant. They should be common misconceptions or related concepts from the same domain.
- **For Short/Long Answers:**
  - Questions should encourage critical thinking and application of concepts.
  - Avoid simple "define X" questions unless the difficulty is Easy.
- Questions should test understanding, not just memorization.
- Return questions in JSON format with structure: {"questions": [{"type": "MCQ/Short Answer/Long Answer", "question": "...", "options": ["Option 1", "Option 2", "Option 3", "Option 4"], "marks": number, "topic": "..."}]}`;

      const userPrompt = `Based on the following curriculum content about ${topics.join(', ')}, generate ${numberOfQuestions} ${assessmentType} questions at ${difficulty} difficulty level.

Curriculum Content:
${combinedContent.substring(0, 15000)}

Generate the questions now:`;

      // Try different AI APIs
      try {
        if (GEMINI_API_KEY) {
          console.log("Generating questions with Google Gemini API...");
          try {
            const aiResponse = await generateWithGemini(userPrompt, systemPrompt);
            questions = parseAIResponse(aiResponse, assessmentType, numberOfQuestions);
            generationMethod = "gemini";
          } catch (geminiError) {
            console.error("Gemini API failed, trying fallback...", geminiError.message);
            // If Gemini fails, don't immediately fall back to local if other APIs are available
            // But for now, we'll let it fall through to local
            // throw geminiError; // Don't throw, let it fall back to local
          }
        } else if (OPENAI_COMPATIBLE_URL && OPENAI_COMPATIBLE_KEY) {
          console.log("Generating questions with OpenAI-compatible API...");
          const aiResponse = await generateWithOpenAICompatible(userPrompt, systemPrompt);
          questions = parseAIResponse(aiResponse, assessmentType, numberOfQuestions);
          generationMethod = "openai-compatible";
        } else if (HF_API_KEY) {
          console.log("Generating questions with HuggingFace API...");
          const aiResponse = await generateWithHuggingFace(`${systemPrompt}\n\n${userPrompt}`);
          questions = parseAIResponse(aiResponse, assessmentType, numberOfQuestions);
          generationMethod = "huggingface";
        }
      } catch (aiError) {
        console.error("AI generation failed, falling back to local:", aiError);
      }
    }

    // Fallback to local generation if AI failed or not configured
    if (questions.length === 0) {
      console.log("Using local question generation...");
      questions = generateQuestionsLocally(
        combinedContent || topics.join(' '),
        { assessmentType, numberOfQuestions, difficulty, topics }
      );
      generationMethod = "local";
    }

    // Step 3: Create assessment object
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const assessmentData = {
      assessmentTitle: title,
      subject: subject,
      assessmentType: assessmentType,
      duration: parseInt(duration),
      difficultyLevel: difficulty,
      passingPercentage: parseInt(passingPercentage),
      numberOfQuestions: questions.length,
      marksPerQuestion: parseInt(marksPerQuestion),
      totalMarks: totalMarks,
      topicsCovered: topics,
      questions: questions,
      generatedAt: new Date().toISOString(),
      generationMethod: generationMethod,
      assessmentFile: `assessment_${Date.now()}.json`,
      createdBy: "local_dev_user",
    };

    // Step 4: Save to database
    const assessment = new Assessment(assessmentData);
    await assessment.save();

    return res.status(200).json({
      type: "success",
      message: `Assessment generated successfully using ${generationMethod} method`,
      data: {
        assessmentId: assessment._id,
        title: title,
        subject: subject,
        assessmentType: assessmentType,
        difficulty: difficulty,
        totalQuestions: questions.length,
        totalMarks: totalMarks,
        questions: questions,
        generationMethod: generationMethod,
        contentSourcesUsed: relevantContent.length,
      },
    });

  } catch (err) {
    console.error("Generate AI questions error:", err);
    return res.status(500).json({
      type: "error",
      message: `Something went wrong while generating questions: ${err.message}`,
      error: err.message,
    });
  }
};

export default connectDB(handler);
