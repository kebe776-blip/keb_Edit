import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolYearId = searchParams.get('schoolYearId')
    const schoolId = searchParams.get('schoolId')
    const studentId = searchParams.get('studentId')
    const paymentType = searchParams.get('paymentType')

    const where: Record<string, unknown> = {}
    if (schoolYearId) where.schoolYearId = schoolYearId
    if (schoolId) where.schoolId = schoolId
    if (studentId) where.studentId = studentId
    if (paymentType) where.paymentType = paymentType

    const payments = await db.payment.findMany({
      where,
      include: {
        student: true,
        schoolYear: true,
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(payments)
  } catch (error) {
    console.error(error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payment = await db.payment.create({
      data: {
        studentId: body.studentId,
        schoolYearId: body.schoolYearId,
        schoolId: body.schoolId,
        amount: body.amount,
        paymentType: body.paymentType ?? 'inscription',
        method: body.method ?? 'especes',
        reference: body.reference,
        description: body.description,
        date: body.date ? new Date(body.date) : new Date(),
      },
    })
    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement' }, { status: 500 })
  }
}
