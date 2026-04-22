import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ]
    }

    const teachers = await db.teacher.findMany({
      where,
      orderBy: { lastName: 'asc' },
      include: {
        teacherAssignments: {
          include: { class: true, subject: true, schoolYear: true },
        },
      },
    })
    return NextResponse.json(teachers)
  } catch (error) {
    console.error(error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const teacher = await db.teacher.create({
      data: {
        schoolId: body.schoolId,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email,
        subject: body.subject,
        address: body.address,
        photo: body.photo,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json(teacher, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la création de l\'enseignant' }, { status: 500 })
  }
}
