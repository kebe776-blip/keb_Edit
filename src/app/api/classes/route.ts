import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const schoolYearId = searchParams.get('schoolYearId')

    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (schoolYearId) where.schoolYearId = schoolYearId

    const classes = await db.classe.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        schoolYear: true,
        enrollments: { include: { student: true } },
        teacherAssignments: { include: { teacher: true, subject: true } },
        _count: { select: { enrollments: true } },
      },
    })
    return NextResponse.json(classes)
  } catch (error) {
    console.error(error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const classe = await db.classe.create({
      data: {
        schoolId: body.schoolId,
        name: body.name,
        level: body.level,
        capacity: body.capacity,
        room: body.room,
        schoolYearId: body.schoolYearId,
      },
    })
    return NextResponse.json(classe, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la création de la classe' }, { status: 500 })
  }
}
