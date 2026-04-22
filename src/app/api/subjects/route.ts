import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId

    const subjects = await db.subject.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(subjects)
  } catch (error) {
    console.error(error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const subject = await db.subject.create({
      data: {
        schoolId: body.schoolId,
        name: body.name,
        code: body.code,
        coefficient: body.coefficient ?? 1,
      },
    })
    return NextResponse.json(subject, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la création de la matière' }, { status: 500 })
  }
}
