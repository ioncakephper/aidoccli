// src/ai/openai.js

const OpenAI = require('openai');
const dotenv = require('dotenv');
dotenv.config();

// --- OpenAI Configuration ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Calls the OpenAI API with a given prompt.
 * @param {string} prompt - The prompt for the OpenAI API.
 * @param {object} options - CLI options.
 * @param {string} options.aiModel - The OpenAI model to use.
 * @param {number} options.aiTemperature - The creativity/randomness setting.
 * @returns {Promise<string>} The response content from the OpenAI API.
 */
exports.callOpenAI = async function callOpenAI(prompt, options) {
  if (!openai.apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not set in your environment variables. Please set it to use AI features.'
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: options.aiModel,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: options.aiTemperature,
      max_tokens: 800, // Increased token limit for more complex code
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error.message);
    throw new Error('Failed to get response from OpenAI API.');
  }
};
