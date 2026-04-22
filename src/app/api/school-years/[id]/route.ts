import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const year = await db.schoolYear.findUnique({
      where: { id },
      include: {
        classes: { orderBy: { name: 'asc' } },
        enrollments: { include: { student: true, class: true } },
      },
    })
    if (!year) {
      return NextResponse.json({ error: 'Année scolaire non trouvée' }, { status: 404 })
    }
    return NextResponse.json(year)
  } catch (error) {
    console.error(error)
    return NextResponse.json(null)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const year = await db.schoolYear.update({
      where: { id },
      data: {
        label: body.label,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        isActive: body.isActive,
        isArchived: body.isArchived,
      },
    })
    return NextResponse.json(year)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'année scolaire' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.schoolYear.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'année scolaire' }, { status: 500 })
  }
}
