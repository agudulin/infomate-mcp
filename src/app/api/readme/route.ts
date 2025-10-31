import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const readmePath = join(process.cwd(), 'README.md');
  const readmeContent = readFileSync(readmePath, 'utf-8');

  return new NextResponse(readmeContent, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
