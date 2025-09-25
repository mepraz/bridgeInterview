import { cookies } from 'next/headers';
import type { User, Session } from './types';
import clientPromise from '@/lib/mongodb';
import { Collection, ObjectId } from 'mongodb';

// Define the shape of the session data
export interface SessionData {
  isLoggedIn: boolean;
  user?: Omit<User, 'password'>;
  role?: 'student' | 'admin';
}

// Define default session data
export const defaultSession: SessionData = {
  isLoggedIn: false,
};

async function getSessionsCollection(): Promise<Collection<Omit<Session, 'id'>>> {
  const client = await clientPromise;
  const db = client.db("pte_ace");
  return db.collection<Omit<Session, 'id'>>('sessions');
}
  
async function getUsersCollection(): Promise<Collection<Omit<User, 'id'>>> {
  const client = await clientPromise;
  const db = client.db("pte_ace");
  return db.collection<Omit<User, 'id'>>('users');
}

// Function to get the current session from the database via cookie
export async function getSession(): Promise<SessionData> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('pte-ace-session')?.value;

  if (!sessionToken) {
    return defaultSession;
  }

  const sessionsCollection = await getSessionsCollection();
  const session = await sessionsCollection.findOne({
    sessionToken,
    expires: { $gt: new Date() },
  });

  if (!session) {
    return defaultSession;
  }

  const usersCollection = await getUsersCollection();
  // Ensure we search by ObjectId
  const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) });

  if (!user) {
    return defaultSession;
  }

  // eslint-disable-next-line no-unused-vars
  const { password, ...userWithoutPassword } = user;

  return {
    isLoggedIn: true,
    role: user.role,
    user: {
      ...userWithoutPassword,
      id: user._id.toString(),
    },
  };
}
