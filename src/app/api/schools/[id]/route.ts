import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const school = await db.school.findUnique({
      where: { id },
      include: {
        schoolYears: { orderBy: { createdAt: 'desc' } },
        students: { where: { isActive: true }, orderBy: { lastName: 'asc' } },
        teachers: { where: { isActive: true }, orderBy: { lastName: 'asc' } },
        classes: { orderBy: { name: 'asc' } },
      },
    })
    if (!school) {
      return NextResponse.json({ error: 'Établissement non trouvé' }, { status: 404 })
    }
    return NextResponse.json(school)
  } catch (error) {
    console.error(error)
    return NextResponse.json(null)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const school = await db.school.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        logo: body.logo,
        description: body.description,
        isActive: body.isActive,
      },
    })
    return NextResponse.json(school)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'établissement' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.school.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'établissement' }, { status: 500 })
  }
}
