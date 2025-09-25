import clientPromise from '@/lib/mongodb';
import { Collection, ObjectId } from 'mongodb';
import type { TestSession, Question, Answer } from '@/lib/types';
import { aiScoreAndFeedback } from '@/ai/flows/ai-score-and-feedback';

async function getQuestionsCollection(): Promise<Collection<Omit<Question, 'id'>>> {
    const client = await clientPromise;
    const db = client.db("pte_ace");
    return db.collection<Omit<Question, 'id'>>('questions');
}

async function getTestSessionsCollection(): Promise<Collection<Omit<TestSession, 'id'>>> {
    const client = await clientPromise;
    const db = client.db("pte_ace");
    return db.collection<Omit<TestSession, 'id'>>('testSessions');
}

/**
 * Scores a given set of answers using an AI model and updates the test session in the database.
 * This function is designed to be resilient, marking the session as 'review-failed' if scoring
 * cannot be completed, but saving any partial scores obtained.
 *
 * @param testSessionId The ObjectId of the test session to score and update.
 * @param answers The array of answers to be scored.
 */
export async function scoreAndSaveSession(testSessionId: ObjectId, answers: Answer[]) {
    const testSessionsCollection = await getTestSessionsCollection();
    try {
      const questionsCollection = await getQuestionsCollection();
      const questionIds = answers.map((a) => new ObjectId(a.questionId));
      const questions = await questionsCollection.find({ _id: { $in: questionIds } }).toArray();
      const questionsMap = new Map(questions.map(q => [q._id.toString(), q]));

      const scoredAnswers: Answer[] = [];
      let totalScore = 0;
      let scoreCount = 0;
      let hasAnyScoringSucceeded = false;

      // Use Promise.all to score all answers concurrently for efficiency.
      const scoringPromises = answers.map(async (answer) => {
        const question = questionsMap.get(answer.questionId);
        if (question && answer.transcript && answer.transcript.trim().length > 0) {
            const aiResult = await aiScoreAndFeedback({
              question: question.text,
              answer: answer.transcript,
            });

            // Even if score is 0, if feedback indicates success, it's a success.
            if (aiResult.score > 0 || (aiResult.score === 0 && !aiResult.feedback.includes("failed"))) {
                hasAnyScoringSucceeded = true;
                scoreCount++;
                totalScore += aiResult.score;
            }

            return {
              ...answer,
              score: aiResult.score,
              feedback: aiResult.feedback,
              rawAIResponse: aiResult.rawResponse, // Save the raw response
            };
        }
        // If there's no transcript or question, return the original unscored answer.
        return answer;
      });

      scoredAnswers.push(...await Promise.all(scoringPromises));
      
      const overallScore = scoreCount > 0 ? totalScore / scoreCount : 0;
      // If not a single question was scored successfully, mark the whole session as failed.
      const finalStatus = hasAnyScoringSucceeded ? 'review-complete' : 'review-failed';
      
      await testSessionsCollection.updateOne(
        { _id: testSessionId },
        { 
          $set: { 
            answers: scoredAnswers,
            status: finalStatus,
            overallScore,
          } 
        }
      );
    } catch (error) {
      console.error(`Critical error during AI scoring for session ${testSessionId}:`, error);
      // Update status to 'review-failed' if a critical error occurs (e.g., database connection)
      await testSessionsCollection.updateOne(
        { _id: testSessionId },
        { $set: { status: 'review-failed', answers } } // Save unscored answers
      );
      // Re-throw the error to be caught by the calling API route if necessary
      throw error;
    }
  }
