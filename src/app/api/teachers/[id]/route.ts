import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const teacher = await db.teacher.findUnique({
      where: { id },
      include: {
        teacherAssignments: {
          include: { class: true, subject: true, schoolYear: true },
        },
      },
    })
    if (!teacher) {
      return NextResponse.json({ error: 'Enseignant non trouvé' }, { status: 404 })
    }
    return NextResponse.json(teacher)
  } catch (error) {
    console.error(error)
    return NextResponse.json(null)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const teacher = await db.teacher.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email,
        subject: body.subject,
        address: body.address,
        photo: body.photo,
        isActive: body.isActive,
      },
    })
    return NextResponse.json(teacher)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'enseignant' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.teacher.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'enseignant' }, { status: 500 })
  }
}
