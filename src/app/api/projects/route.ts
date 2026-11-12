import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const projects = await db.project.findMany({
      include: {
        repositories: true,
        _count: {
          select: { bugs: true, jobs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ projects });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, key, description, organizationId } = body;

    let orgId = organizationId;
    if (!orgId) {
      const defaultOrg = await db.organization.findFirst();
      if (!defaultOrg) {
        return NextResponse.json({ error: 'No organization found' }, { status: 400 });
      }
      orgId = defaultOrg.id;
    }

    const project = await db.project.create({
      data: {
        organizationId: orgId,
        name,
        key: key.toUpperCase(),
        description: description || ''
      }
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
