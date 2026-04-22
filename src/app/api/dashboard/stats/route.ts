import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')
    const schoolYearId = searchParams.get('schoolYearId')

    if (!schoolId || !schoolYearId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalPayments,
      totalSubjects,
      recentEnrollments,
      paymentStats,
    ] = await Promise.all([
      db.student.count({ where: { schoolId, isActive: true } }),
      db.teacher.count({ where: { schoolId, isActive: true } }),
      db.classe.count({ where: { schoolId, schoolYearId } }),
      db.payment.aggregate({
        where: { schoolId, schoolYearId },
        _sum: { amount: true },
        _count: true,
      }),
      db.subject.count({ where: { schoolId } }),
      db.enrollment.findMany({
        where: { schoolYearId },
        include: { student: true, class: true },
        orderBy: { enrolledAt: 'desc' },
        take: 5,
      }),
      db.payment.groupBy({
        by: ['paymentType'],
        where: { schoolId, schoolYearId },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    const maleCount = await db.student.count({ where: { schoolId, gender: 'M', isActive: true } })
    const femaleCount = await db.student.count({ where: { schoolId, gender: 'F', isActive: true } })

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      totalPayments: totalPayments._sum.amount ?? 0,
      paymentCount: totalPayments._count,
      totalSubjects,
      recentEnrollments,
      paymentStats,
      maleCount,
      femaleCount,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      totalPayments: 0,
      paymentCount: 0,
      totalSubjects: 0,
      recentEnrollments: [],
      paymentStats: [],
      maleCount: 0,
      femaleCount: 0,
    })
  }
}
