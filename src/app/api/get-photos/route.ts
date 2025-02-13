import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const memoriesDir = path.join(process.cwd(), 'public', 'memories');
    const files = fs.readdirSync(memoriesDir);
    
    // Filter for image files only
    const photos = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png'].includes(ext);
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error reading photos directory:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}