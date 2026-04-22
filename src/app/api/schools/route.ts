import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const schools = await db.school.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(schools)
  } catch (error) {
    console.error(error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const school = await db.school.create({
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email,
        logo: body.logo,
        description: body.description,
        isActive: body.isActive ?? true,
      },
    })
    return NextResponse.json(school, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la création de l\'établissement' }, { status: 500 })
  }
}
