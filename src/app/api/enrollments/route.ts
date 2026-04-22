import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const schoolYearId = searchParams.get('schoolYearId')
    const studentId = searchParams.get('studentId')

    const where: Record<string, unknown> = {}
    if (classId) where.classId = classId
    if (schoolYearId) where.schoolYearId = schoolYearId
    if (studentId) where.studentId = studentId

    const enrollments = await db.enrollment.findMany({
      where,
      include: {
        student: true,
        class: true,
        schoolYear: true,
      },
      orderBy: { enrolledAt: 'desc' },
    })
    return NextResponse.json(enrollments)
  } catch (error) {
    console.error(error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const enrollment = await db.enrollment.create({
      data: {
        studentId: body.studentId,
        classId: body.classId,
        schoolYearId: body.schoolYearId,
      },
    })
    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const studentId = searchParams.get('studentId')
    const classId = searchParams.get('classId')
    const schoolYearId = searchParams.get('schoolYearId')

    if (id) {
      await db.enrollment.delete({ where: { id } })
    } else if (studentId && classId && schoolYearId) {
      await db.enrollment.deleteMany({
        where: { studentId, classId, schoolYearId },
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'inscription' }, { status: 500 })
  }
}
