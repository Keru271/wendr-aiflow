import { NextRequest, NextResponse } from 'next/server';
import { agyCli } from '@/lib/agy-cli';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isAvailable = await agyCli.isAvailable();
    const status = await agyCli.getRemoteControlStatus();
    const version = await agyCli.getVersion();

    return NextResponse.json({
      success: true,
      cliAvailable: isAvailable,
      cliPath: status.cliPath,
      version: version || '2.0',
      remoteControl: {
        daemonStatus: status.daemonStatus,
        instanceName: status.instanceName || null,
        rawOutput: status.rawOutput,
        browserUrl: 'https://antigravity.google.com'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'start'; // 'start' | 'stop'
    const name = body.name;

    if (action === 'start') {
      const result = await agyCli.startRemoteControl(name);
      return NextResponse.json({
        success: true,
        message: 'Antigravity CLI remote-control daemon started successfully.',
        output: result.output,
        browserUrl: 'https://antigravity.google.com'
      });
    } else if (action === 'stop') {
      const result = await agyCli.stopRemoteControl();
      return NextResponse.json({
        success: true,
        message: 'Antigravity CLI remote-control daemon stopped.',
        output: result.output
      });
    } else {
      return NextResponse.json({ error: 'Invalid action. Supported actions: start, stop' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

