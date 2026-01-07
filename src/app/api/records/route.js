import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs'; // Ensure Node runtime for database operations

export async function POST(request) {
  try {
    const sessionAuth = await getServerSession(authOptions);
    if (!sessionAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, text, gitLink, timestamp, files, audioUrl, audioDuration } = await request.json();

    if (!sessionId || !timestamp) {
      return NextResponse.json({ error: 'Session ID and timestamp are required' }, { status: 400 });
    }

    // Verify session belongs to user's project
    const sessionData = await prisma.session.findFirst({
      where: {
        id: sessionId,
        project: {
          userId: sessionAuth.user.id,
        },
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const record = await prisma.record.create({
      data: {
        sessionId,
        text,
        gitLink,
        timestamp: new Date(timestamp),
        files: {
          create: files?.map(file => ({
            name: file.name,
            url: file.url,
            type: file.type,
            size: file.size,
          })) || [],
        },
        audio: audioUrl ? {
          create: {
            url: audioUrl,
            duration: audioDuration,
          },
        } : undefined,
      },
      include: {
        files: true,
        audio: true,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Create record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}