import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const search = searchParams.get('search')
    const classId = searchParams.get('classId')
    const schoolYearId = searchParams.get('schoolYearId')
    const active = searchParams.get('active')

    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (active === 'true') where.isActive = true
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ]
    }
    if (classId && schoolYearId) {
      where.enrollments = { some: { classId, schoolYearId } }
    }

    const students = await db.student.findMany({
      where,
      orderBy: { lastName: 'asc' },
      include: classId && schoolYearId ? {
        enrollments: {
          where: { classId, schoolYearId },
          include: { class: true },
        },
      } : undefined,
    })
    return NextResponse.json(students)
  } catch (error) {
    console.error(error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const student = await db.student.create({
      data: {
        schoolId: body.schoolId,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender ?? 'M',
        address: body.address,
        phone: body.phone,
        email: body.email,
        parentName: body.parentName,
        parentPhone: body.parentPhone,
        photo: body.photo,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la création de l\'élève' }, { status: 500 })
  }
}
