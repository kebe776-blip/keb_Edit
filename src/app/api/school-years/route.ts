import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    const years = await db.schoolYear.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(years)
  } catch (error) {
    console.error(error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const year = await db.schoolYear.create({
      data: {
        schoolId: body.schoolId,
        label: body.label,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json(year, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la création de l\'année scolaire' }, { status: 500 })
  }
}
