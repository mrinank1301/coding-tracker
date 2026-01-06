import { NextResponse } from 'next/server';

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'Origin': 'https://leetcode.com',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `LeetCode API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('LeetCode proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from LeetCode' },
      { status: 500 }
    );
  }
}

