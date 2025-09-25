'use server';

/**
 * @fileOverview A flow that determines the difficulty of the next question based on the student's performance.
 *
 * - adjustQuestionDifficulty - A function that adjusts the difficulty of the next question.
 * - AdjustQuestionDifficultyInput - The input type for the adjustQuestionDifficulty function.
 * - AdjustQuestionDifficultyOutput - The return type for the adjustQuestionDifficulty function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustQuestionDifficultyInputSchema = z.object({
  studentPerformanceScore: z
    .number()
    .describe('The student performance score on the previous question.'),
  currentDifficulty: z
    .number()
    .describe('The current difficulty level of the questions.'),
  adaptiveParams: z
    .object({
      difficultyIncrement: z
        .number()
        .describe('The amount to increment the difficulty by.'),
      difficultyDecrement: z
        .number()
        .describe('The amount to decrement the difficulty by.'),
      upperBound: z.number().describe('The maximum difficulty level.'),
      lowerBound: z.number().describe('The minimum difficulty level.'),
      scoreThreshold: z
        .number()
        .describe(
          'The score threshold above which the difficulty should increase.'
        ),
    })
    .describe('The parameters for adaptive questioning.'),
});
export type AdjustQuestionDifficultyInput = z.infer<
  typeof AdjustQuestionDifficultyInputSchema
>;

const AdjustQuestionDifficultyOutputSchema = z.object({
  newDifficulty: z
    .number()
    .describe('The adjusted difficulty level for the next question.'),
});
export type AdjustQuestionDifficultyOutput = z.infer<
  typeof AdjustQuestionDifficultyOutputSchema
>;

export async function adjustQuestionDifficulty(
  input: AdjustQuestionDifficultyInput
): Promise<AdjustQuestionDifficultyOutput> {
  return adjustQuestionDifficultyFlow(input);
}

const adjustQuestionDifficultyPrompt = ai.definePrompt({
  name: 'adjustQuestionDifficultyPrompt',
  input: {schema: AdjustQuestionDifficultyInputSchema},
  output: {schema: AdjustQuestionDifficultyOutputSchema},
  prompt: `You are an AI that adjusts the difficulty of questions based on student performance.

Given the student's performance score on the previous question ({{{studentPerformanceScore}}}), the current difficulty level ({{{currentDifficulty}}}), and the following adaptive parameters:

Difficulty Increment: {{{adaptiveParams.difficultyIncrement}}}
Difficulty Decrement: {{{adaptiveParams.difficultyDecrement}}}
Upper Bound: {{{adaptiveParams.upperBound}}}
Lower Bound: {{{adaptiveParams.lowerBound}}}
Score Threshold: {{{adaptiveParams.scoreThreshold}}}

determine the new difficulty level for the next question.

If the student's performance score is above the score threshold, increase the difficulty by the difficulty increment, but do not exceed the upper bound.
If the student's performance score is below the score threshold, decrease the difficulty by the difficulty decrement, but do not go below the lower bound.

Return the new difficulty level.

Ensure that the new difficulty is within the upper and lower bounds.

New Difficulty:`,
});

const adjustQuestionDifficultyFlow = ai.defineFlow(
  {
    name: 'adjustQuestionDifficultyFlow',
    inputSchema: AdjustQuestionDifficultyInputSchema,
    outputSchema: AdjustQuestionDifficultyOutputSchema,
  },
  async input => {
    let newDifficulty: number;
    if (input.studentPerformanceScore > input.adaptiveParams.scoreThreshold) {
      newDifficulty = Math.min(
        input.currentDifficulty + input.adaptiveParams.difficultyIncrement,
        input.adaptiveParams.upperBound
      );
    } else {
      newDifficulty = Math.max(
        input.currentDifficulty - input.adaptiveParams.difficultyDecrement,
        input.adaptiveParams.lowerBound
      );
    }

    return {newDifficulty};
  }
);
