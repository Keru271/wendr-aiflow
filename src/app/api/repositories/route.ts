import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    // Support Bulk Addition: { projectId, repositories: [...] }
    if (body.repositories && Array.isArray(body.repositories)) {
      const { projectId, repositories } = body;
      if (!projectId || repositories.length === 0) {
        return NextResponse.json(
          { error: 'Missing projectId or empty repositories list' },
          { status: 400 }
        );
      }

      const created = [];
      for (const repo of repositories) {
        const owner = repo.owner?.trim();
        const name = repo.name?.trim();
        const defaultBranch = repo.defaultBranch?.trim() || 'main';
        const githubRepoId = String(repo.id || repo.githubRepoId || `${owner}_${name}`);
        const cloneUrl = repo.cloneUrl || `https://github.com/${owner}/${name}.git`;

        if (!owner || !name) continue;

        const upserted = await db.repository.upsert({
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
            cloneUrl
          },
          create: {
            projectId,
            githubRepoId,
            owner,
            name,
            defaultBranch,
            cloneUrl
          }
        });
        created.push(upserted);
      }

      return NextResponse.json(
        { success: true, count: created.length, repositories: created },
        { status: 201 }
      );
    }

    // Single Addition: { projectId, owner, name, defaultBranch, cloneUrl, githubRepoId }
    const { projectId, owner, name, defaultBranch = 'main', cloneUrl, githubRepoId: customId } = body;

    if (!projectId || !owner || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, owner, name' },
        { status: 400 }
      );
    }

    const githubRepoId = String(customId || `${owner}_${name}`);
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing repository id' }, { status: 400 });
    }

    await db.repository.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Repository disconnected successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
