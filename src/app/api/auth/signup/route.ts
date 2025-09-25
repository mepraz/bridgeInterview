import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { Collection } from 'mongodb';
import type { User } from '@/lib/types';

async function getUsersCollection(): Promise<Collection<Omit<User, 'id'>>> {
    const client = await clientPromise;
    const db = client.db("pte_ace");
    return db.collection<Omit<User, 'id'>>('users');
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const usersCollection = await getUsersCollection();

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: 'student' as const,
      isApproved: false,
    };

    const result = await usersCollection.insertOne(newUser);

    return NextResponse.json({ message: 'User created successfully', userId: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
  }
}
