import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const integrations = await db.integration.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ integrations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, name, metadata, organizationId } = body;

    let orgId = organizationId;
    if (!orgId) {
      const org = await db.organization.findFirst();
      if (!org) return NextResponse.json({ error: 'No organization found' }, { status: 400 });
      orgId = org.id;
    }

    const integration = await db.integration.upsert({
      where: {
        organizationId_provider: {
          organizationId: orgId,
          provider: provider.toUpperCase()
        }
      },
      update: {
        name,
        status: 'CONNECTED',
        metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata
      },
      create: {
        organizationId: orgId,
        provider: provider.toUpperCase(),
        name,
        status: 'CONNECTED',
        metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata
      }
    });

    return NextResponse.json({ integration });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
