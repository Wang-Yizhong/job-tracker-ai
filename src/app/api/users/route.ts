import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const users = await prisma.user.findMany()
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body?.name || !body?.email) {
    return NextResponse.json({ error: 'name & email required' }, { status: 400 })
  }
  try {
    const created = await prisma.user.create({ data: { name: body.name, email: body.email } })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    return NextResponse.json({ error: e?.message ?? 'Create failed' }, { status: 400 })
  }
}
