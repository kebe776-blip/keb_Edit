import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const classe = await db.classe.findUnique({
      where: { id },
      include: {
        schoolYear: true,
        enrollments: { include: { student: true } },
        teacherAssignments: { include: { teacher: true, subject: true } },
      },
    })
    if (!classe) {
      return NextResponse.json({ error: 'Classe non trouvée' }, { status: 404 })
    }
    return NextResponse.json(classe)
  } catch (error) {
    console.error(error)
    return NextResponse.json(null)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const classe = await db.classe.update({
      where: { id },
      data: {
        name: body.name,
        level: body.level,
        capacity: body.capacity,
        room: body.room,
      },
    })
    return NextResponse.json(classe)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la classe' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.classe.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de la classe' }, { status: 500 })
  }
}
