import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs'; // Ensure Node runtime for database operations

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, startTime, endTime, duration, records } = await request.json();

    if (!projectId || !startTime || duration === undefined) {
      return NextResponse.json({ error: 'Project ID, start time, and duration are required' }, { status: 400 });
    }

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const newSession = await prisma.session.create({
      data: {
        projectId,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        duration,
        records: {
          create: records?.map(record => ({
            text: record.text,
            gitLink: record.gitLink,
            timestamp: new Date(record.timestamp),
            files: {
              create: record.files?.map(file => ({
                name: file.name,
                url: file.url,
                type: file.type,
                size: file.size,
              })) || [],
            },
            audio: record.audioUrl ? {
              create: {
                url: record.audioUrl,
                duration: record.audioDuration,
              },
            } : undefined,
          })) || [],
        },
      },
      include: {
        records: {
          include: {
            files: true,
            audio: true,
          },
        },
      },
    });

    return NextResponse.json(newSession);
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}