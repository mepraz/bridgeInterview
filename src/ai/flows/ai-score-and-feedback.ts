'use server';

/**
 * @fileOverview This file contains the AI scoring and feedback flow for the PTE mock interview system.
 *
 * It takes the student's answer as input and returns an AI-generated score and feedback, plus the raw AI response.
 *
 * @file        ai-score-and-feedback.ts
 * @exports   AIScoreAndFeedbackInput
 * @exports   AIScoreAndFeedbackOutput
 * @exports   aiScoreAndFeedback
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIScoreAndFeedbackInputSchema = z.object({
  answer: z.string().describe("The student's answer to the question."),
  question: z.string().describe('The question that the student answered.'),
});
export type AIScoreAndFeedbackInput = z.infer<typeof AIScoreAndFeedbackInputSchema>;

const AIScoreAndFeedbackOutputSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(10)
    .describe('A score from 0 to 10 for the answer, where 10 is a perfect, fluent, and relevant answer. Return 0 if scoring is not possible.'),
  feedback: z
    .string()
    .describe('Constructive feedback for the student, focusing on grammar, pronunciation, and relevance. If scoring failed, explain why.'),
  rawResponse: z.string().optional().describe('The raw text response from the AI model for debugging purposes.'),
});
export type AIScoreAndFeedbackOutput = z.infer<typeof AIScoreAndFeedbackOutputSchema>;

export async function aiScoreAndFeedback(input: AIScoreAndFeedbackInput): Promise<AIScoreAndFeedbackOutput> {
  return aiScoreAndFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiScoreAndFeedbackPrompt',
  input: {schema: AIScoreAndFeedbackInputSchema},
  output: {schema: AIScoreAndFeedbackOutputSchema.omit({ rawResponse: true })}, // The model shouldn't generate the rawResponse field
  prompt: `You are an expert AI examiner for the PTE (Pearson Test of English) speaking section. Your task is to evaluate a student's response to a given question.

  Analyze the student's answer for fluency, pronunciation, relevance to the question, and grammatical accuracy.

  Based on your analysis, provide a score from 1 to 10, where 10 represents a flawless, native-level response.

  Then, provide concise, constructive feedback to help the student improve. The feedback should be encouraging and focus on the most important areas for improvement.

  Question:
  "{{{question}}}"

  Student's Answer:
  "{{{answer}}}"

  Based on this, generate the score and feedback. If the student's answer is empty or completely irrelevant, provide a score of 0 and appropriate feedback.`,
});

const aiScoreAndFeedbackFlow = ai.defineFlow(
  {
    name: 'aiScoreAndFeedbackFlow',
    inputSchema: AIScoreAndFeedbackInputSchema,
    outputSchema: AIScoreAndFeedbackOutputSchema,
  },
  async input => {
    try {
      const response = await prompt(input);
      const output = response.output;
      if (!output) {
        throw new Error('The AI model did not return a valid score and feedback.');
      }
      return {
        ...output,
        rawResponse: response.text, // Capture the raw text response
      };
    } catch (error) {
        console.error("Error in aiScoreAndFeedbackFlow:", error);
        // Return a fallback response in case of any error to prevent crashing the entire session scoring.
        return {
            score: 0,
            feedback: "Automated scoring failed for this question due to a technical issue. An admin can re-trigger this process.",
            rawResponse: error instanceof Error ? error.message : String(error),
        };
    }
  }
);
