import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { schoolId, currentYearId, newYearLabel, newYearStartDate, newYearEndDate } = body

    if (!schoolId || !currentYearId || !newYearLabel) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Archive current year
    await db.schoolYear.update({
      where: { id: currentYearId },
      data: { isActive: false, isArchived: true },
    })

    // Create new year
    const newYear = await db.schoolYear.create({
      data: {
        schoolId,
        label: newYearLabel,
        startDate: new Date(newYearStartDate),
        endDate: new Date(newYearEndDate),
        isActive: true,
        isArchived: false,
      },
    })

    return NextResponse.json(newYear, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de l\'archivage' }, { status: 500 })
  }
}
