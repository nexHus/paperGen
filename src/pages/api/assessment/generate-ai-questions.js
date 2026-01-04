/**
 * AI-Powered Question Generation API
 * Uses HuggingFace's free API or local fallback for generating questions
 * from curriculum content stored in ChromaDB
 */

import connectDB from "@/middlewares/connectDB";
import ChromaDBManager from "@/utils/chromaManager";
import Assessment from "@/models/Assessment";

// HuggingFace API configuration (free tier)
const HF_API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-large";
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";

// OpenAI-compatible API (can use free alternatives like Together AI, Groq, etc.)
const OPENAI_COMPATIBLE_URL = process.env.OPENAI_COMPATIBLE_URL || "";
const OPENAI_COMPATIBLE_KEY = process.env.OPENAI_COMPATIBLE_KEY || "";

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
    
    questions.push({
      id: `q_${i + 1}`,
      type: "MCQ",
      difficulty: difficulty,
      question: template.replace('{keyword}', keyword).replace('{sentence}', sentence.substring(0, 100)),
      options: generateMCQOptions(keyword, content),
      correctAnswer: 0,
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

    try {
      const chromaManager = new ChromaDBManager();
      chromaAvailable = await chromaManager.checkConnection();

      if (chromaAvailable) {
        for (const topic of topics) {
          try {
            const searchResults = await chromaManager.search(topic, 5);
            if (searchResults.documents && searchResults.documents[0]) {
              relevantContent.push(...searchResults.documents[0]);
            }
          } catch (searchError) {
            console.error(`Error searching for topic "${topic}":`, searchError.message);
          }
        }
      } else {
        console.log("ChromaDB not available, proceeding with local generation only");
      }
    } catch (chromaError) {
      console.error("ChromaDB connection error:", chromaError.message);
      // Continue without ChromaDB - will use local generation
    }

    // Combine all relevant content
    const combinedContent = relevantContent.join('\n\n');

    if (!combinedContent || combinedContent.length < 100) {
      // Generate questions without curriculum content (use topics only)
      console.log("No curriculum content found, generating generic questions based on topics...");
    }

    // Step 2: Generate questions
    let questions = [];
    let generationMethod = "local";

    if (useAI && combinedContent.length > 100) {
      // Build prompt for AI
      const systemPrompt = `You are an expert educator creating assessment questions. Generate high-quality ${assessmentType} questions based on the provided curriculum content. 
      
Rules:
- Create exactly ${numberOfQuestions} questions
- Difficulty level: ${difficulty}
- For MCQs: provide 4 options with one correct answer
- Questions should test understanding, not just memorization
- Return questions in JSON format with structure: {"questions": [{"type": "MCQ/Short Answer/Long Answer", "question": "...", "options": ["A", "B", "C", "D"] (for MCQ), "marks": number, "topic": "..."}]}`;

      const userPrompt = `Based on the following curriculum content about ${topics.join(', ')}, generate ${numberOfQuestions} ${assessmentType} questions at ${difficulty} difficulty level.

Curriculum Content:
${combinedContent.substring(0, 3000)}

Generate the questions now:`;

      // Try different AI APIs
      try {
        if (OPENAI_COMPATIBLE_URL && OPENAI_COMPATIBLE_KEY) {
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
      message: "Something went wrong while generating questions.",
      error: err.message,
    });
  }
};

export default connectDB(handler);
