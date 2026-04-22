import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolYearId = searchParams.get('schoolYearId')
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')
    const studentId = searchParams.get('studentId')
    const trimester = searchParams.get('trimester')

    const where: Record<string, unknown> = {}
    if (schoolYearId) where.schoolYearId = schoolYearId
    if (classId) where.classId = classId
    if (subjectId) where.subjectId = subjectId
    if (studentId) where.studentId = studentId
    if (trimester) where.trimester = parseInt(trimester)

    const grades = await db.grade.findMany({
      where,
      include: {
        student: true,
        subject: true,
        schoolYear: true,
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(grades)
  } catch (error) {
    console.error(error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const grade = await db.grade.create({
      data: {
        studentId: body.studentId,
        subjectId: body.subjectId,
        schoolYearId: body.schoolYearId,
        classId: body.classId,
        trimester: body.trimester,
        examType: body.examType ?? 'devoir',
        score: body.score,
        maxScore: body.maxScore ?? 20,
        comment: body.comment,
        date: body.date ? new Date(body.date) : new Date(),
      },
    })
    return NextResponse.json(grade, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la création de la note' }, { status: 500 })
  }
}
