import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const student = await db.student.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: { class: true, schoolYear: true },
          orderBy: { enrolledAt: 'desc' },
        },
        grades: {
          include: { subject: true, schoolYear: true },
          orderBy: { date: 'desc' },
        },
        payments: {
          include: { schoolYear: true },
          orderBy: { date: 'desc' },
        },
      },
    })
    if (!student) {
      return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 })
    }
    return NextResponse.json(student)
  } catch (error) {
    console.error(error)
    return NextResponse.json(null)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const student = await db.student.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender,
        address: body.address,
        phone: body.phone,
        email: body.email,
        parentName: body.parentName,
        parentPhone: body.parentPhone,
        photo: body.photo,
        isActive: body.isActive,
      },
    })
    return NextResponse.json(student)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'élève' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.student.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'élève' }, { status: 500 })
  }
}
