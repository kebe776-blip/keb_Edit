import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const subject = await db.subject.findUnique({
      where: { id },
      include: {
        teacherAssignments: { include: { teacher: true, class: true, schoolYear: true } },
      },
    })
    if (!subject) {
      return NextResponse.json({ error: 'Matière non trouvée' }, { status: 404 })
    }
    return NextResponse.json(subject)
  } catch (error) {
    console.error(error)
    return NextResponse.json(null)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const subject = await db.subject.update({
      where: { id },
      data: {
        name: body.name,
        code: body.code,
        coefficient: body.coefficient,
      },
    })
    return NextResponse.json(subject)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la matière' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.subject.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de la matière' }, { status: 500 })
  }
}
