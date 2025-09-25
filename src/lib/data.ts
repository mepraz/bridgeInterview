import type { User, Question, TestSession } from '@/lib/types';

export const mockUsers: User[] = [
  {
    id: 'user_1',
    email: 'student.approved@example.com',
    role: 'student',
    isApproved: true,
    name: 'Alex Johnson',
  },
  {
    id: 'user_2',
    email: 'student.pending@example.com',
    role: 'student',
    isApproved: false,
    name: 'Samira Khan',
  },
  {
    id: 'user_3',
    email: 'admin@example.com',
    role: 'admin',
    isApproved: true,
    name: 'Dr. Evelyn Reed',
  },
  {
    id: 'user_4',
    email: 'casey.b@example.com',
    role: 'student',
    isApproved: true,
    name: 'Casey Becker',
  },
  {
    id: 'user_5',
    email: 'morgan.d@example.com',
    role: 'student',
    isApproved: false,
    name: 'Morgan Davis',
  },
];

export const mockQuestions: Question[] = [
  { id: 'q1', text: 'Describe a time you had to learn a new skill.', timer: 60, difficulty: 3 },
  { id: 'q2', text: 'What is your opinion on the impact of technology on society?', timer: 90, difficulty: 5 },
  { id: 'q3', text: 'Summarize the main points of a recent news article you read.', timer: 75, difficulty: 4 },
  { id: 'q4', text: 'Explain a complex topic from your field of study to someone unfamiliar with it.', timer: 120, difficulty: 8 },
  { id: 'q5', text: 'What are the advantages and disadvantages of remote work?', timer: 90, difficulty: 6 },
  { id: 'q6', text: 'Describe your favorite movie and explain why you like it.', timer: 60, difficulty: 2 },
  { id: 'q7', text: 'Discuss the importance of environmental conservation.', timer: 90, difficulty: 7 },
  { id: 'q8', text: 'Tell us about a challenge you faced and how you overcame it.', timer: 75, difficulty: 5 },
];

export const mockTestSessions: TestSession[] = [
  {
    id: 'session_1',
    studentId: 'user_1',
    status: 'review-complete',
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000), // 15 mins later
    overallScore: 7.8,
    answers: [
      {
        questionId: 'q1',
        transcript: "I had to learn a new skill when I started my internship. I was asked to use a new project management software called Asana. I spent the first weekend watching tutorials and practicing creating tasks and projects. It was challenging at first, but I quickly got the hang of it.",
        score: 8,
        feedback: "Good response. Clear and concise explanation of the situation. To improve, you could add more detail about a specific challenge you faced while learning the new skill.",
      },
      {
        questionId: 'q2',
        transcript: "Technology has a big impact on society. It's good because we can connect with people, but it's also bad because of privacy issues. I think we need more rules.",
        score: 6,
        feedback: "You've touched on some key points. The answer could be strengthened by providing specific examples for both the positive and negative impacts you mentioned. Try to elaborate more on your personal opinion.",
      },
    ],
  },
  {
    id: 'session_2',
    studentId: 'user_1',
    status: 'review-pending',
    startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000),
    answers: [],
  }
];
