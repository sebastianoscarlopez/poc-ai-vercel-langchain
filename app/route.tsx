import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
  console.log('HOME PAGE')
  return NextResponse.redirect(new URL('/chat', req.url))
};

