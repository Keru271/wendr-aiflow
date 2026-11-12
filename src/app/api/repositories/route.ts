import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    const where: any = {};
    if (projectId) where.projectId = projectId;

    const repositories = await db.repository.findMany({
      where,
      include: { project: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ repositories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, owner, name, defaultBranch = 'main', cloneUrl } = body;

    if (!projectId || !owner || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, owner, name' },
        { status: 400 }
      );
    }

    const githubRepoId = `repo_${owner}_${name}_${Date.now()}`;
    const generatedCloneUrl = cloneUrl || `https://github.com/${owner}/${name}.git`;

    const repo = await db.repository.upsert({
      where: {
        projectId_githubRepoId: {
          projectId,
          githubRepoId
        }
      },
      update: {
        owner,
        name,
        defaultBranch,
        cloneUrl: generatedCloneUrl
      },
      create: {
        projectId,
        githubRepoId,
        owner,
        name,
        defaultBranch,
        cloneUrl: generatedCloneUrl
      }
    });

    return NextResponse.json({ repository: repo }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

