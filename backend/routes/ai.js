const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const OpenAI = require('openai');
const adminMiddleware = require('../middleware/adminMiddleware');

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

// Helper function to extract JSON from OpenAI response
const extractJson = (text) => {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    throw new Error('Failed to parse AI response as JSON');
  }
};

const SYSTEM_PROMPT = `
You are an expert educational content creator.
Generate multiple-choice questions based on the provided topic or text.
Respond ONLY with a valid JSON array of objects. Do NOT include markdown formatting like \`\`\`json.
Each object must have this exact structure:
{
  "questionText": "The question string",
  "options": [
    { "optionLabel": "A", "optionText": "First option text", "isCorrect": false },
    { "optionLabel": "B", "optionText": "Second option text", "isCorrect": true },
    { "optionLabel": "C", "optionText": "Third option text", "isCorrect": false },
    { "optionLabel": "D", "optionText": "Fourth option text", "isCorrect": false }
  ],
  "explanation": "Explanation for the correct answer"
}
Ensure there is exactly one correct option per question.
`;

// Route: Generate questions from a topic
router.post('/generate', adminMiddleware, async (req, res) => {
  try {
    const { topic, difficulty, count } = req.body;
    
    if (!topic) return res.status(400).json({ success: false, message: 'Topic is required' });
    
    const numQuestions = count || 5;
    const diff = difficulty || 'Medium';

    const prompt = `Generate ${numQuestions} multiple-choice questions about "${topic}" at a ${diff} difficulty level.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    const questions = extractJson(response.choices[0].message.content);
    res.json({ success: true, questions });
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate questions' });
  }
});

// Route: Generate questions from uploaded PDF
router.post('/upload-pdf', adminMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Parse PDF text
    const pdfData = await pdfParse(req.file.buffer);
    const textContent = pdfData.text;

    if (!textContent || textContent.trim() === '') {
      return res.status(400).json({ success: false, message: 'Could not extract text from PDF' });
    }

    // Limit text length to avoid token limits (approximate to ~3000 words)
    const truncatedText = textContent.substring(0, 15000);

    const prompt = `Extract all multiple-choice questions, options, and answers from the following text. If there are no clear questions, generate 5 questions based on the text.\n\nText:\n${truncatedText}`;

    // fallback to normal gpt-3.5-turbo if 16k is deprecated, but 3.5-turbo now has 16k context by default in newer versions
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', 
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    });

    const questions = extractJson(response.choices[0].message.content);
    res.json({ success: true, questions });
  } catch (error) {
    console.error('PDF Parsing/AI Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process PDF' });
  }
});

module.exports = router;
