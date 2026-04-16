// GET /api/geocoding/candidates?q=...
// Proxy to CartoCiudad candidates endpoint for client-side autocomplete
// Requisitos: 15.1, 15.2

import { NextRequest, NextResponse } from 'next/server';
import { searchCandidates } from '@/lib/services/geocoding.service';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') ?? '5', 10);

  if (!query || query.trim().length < 3) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const candidates = await searchCandidates(query.trim(), Math.min(limit, 10));
    return NextResponse.json(candidates, { status: 200 });
  } catch {
    // Return empty array on error to avoid breaking autocomplete UX
    return NextResponse.json([], { status: 200 });
  }
}
