'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  GraduationCap,
  UserCheck,
  BookOpen,
  Wallet,
  TrendingUp,
  Users,
} from 'lucide-react'

interface Stats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalPayments: number
  paymentCount: number
  totalSubjects: number
  recentEnrollments: { id: string; student: { firstName: string; lastName: string }; class: { name: string }; enrolledAt: string }[]
  paymentStats: { paymentType: string; _sum: { amount: number }; _count: number }[]
  maleCount: number
  femaleCount: number
}

const PAYMENT_LABELS: Record<string, string> = {
  inscription: 'Inscription',
  scolarite: 'Scolarité',
  autre: 'Autre',
}

export default function Dashboard() {
  const { selectedSchoolId, selectedSchoolYearId, setCurrentView } = useAppStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadedSchoolId, setLoadedSchoolId] = useState<string | null>(null)
  const [loadedYearId, setLoadedYearId] = useState<string | null>(null)
  const loading = !!selectedSchoolId && !!selectedSchoolYearId && 
    (loadedSchoolId !== selectedSchoolId || loadedYearId !== selectedSchoolYearId || stats === null)

  useEffect(() => {
    if (!selectedSchoolId || !selectedSchoolYearId) return
    let cancelled = false
    fetch(
      `/api/dashboard/stats?schoolId=${selectedSchoolId}&schoolYearId=${selectedSchoolYearId}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setStats(data)
          setLoadedSchoolId(selectedSchoolId)
          setLoadedYearId(selectedSchoolYearId)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(null)
          setLoadedSchoolId(selectedSchoolId)
          setLoadedYearId(selectedSchoolYearId)
        }
      })
    return () => { cancelled = true }
  }, [selectedSchoolId, selectedSchoolYearId])

  if (!selectedSchoolId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-muted-foreground">
        <GraduationCap className="h-16 w-16 opacity-30" />
        <p className="text-lg font-medium">Veuillez sélectionner un établissement</p>
        <p className="text-sm">Choisissez un établissement dans le menu latéral pour commencer.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Tableau de bord</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Élèves',
      value: stats?.totalStudents ?? 0,
      icon: GraduationCap,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      subtitle: `${stats?.maleCount ?? 0} garçons, ${stats?.femaleCount ?? 0} filles`,
    },
    {
      title: 'Enseignants',
      value: stats?.totalTeachers ?? 0,
      icon: UserCheck,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      subtitle: 'Personnel actif',
    },
    {
      title: 'Classes',
      value: stats?.totalClasses ?? 0,
      icon: BookOpen,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      subtitle: `${stats?.totalSubjects ?? 0} matières`,
    },
    {
      title: 'Total Paiements',
      value: `${((stats?.totalPayments ?? 0) / 1000).toFixed(1)}K`,
      icon: Wallet,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      subtitle: `${stats?.paymentCount ?? 0} transactions`,
    },
  ]

  const quickActions = [
    { label: 'Gérer les élèves', view: 'students' },
    { label: 'Saisir les notes', view: 'grades' },
    { label: 'Enregistrer un paiement', view: 'payments' },
    { label: 'Gérer les classes', view: 'classes-subjects' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tableau de bord</h2>
          <p className="text-muted-foreground text-sm">Vue d&apos;ensemble de votre établissement</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Répartition des paiements</CardTitle>
            <CardDescription>Par type pour l&apos;année en cours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.paymentStats && stats.paymentStats.length > 0 ? (
              stats.paymentStats.map((ps) => {
                const total = stats.paymentStats.reduce((s, p) => s + (p._sum.amount || 0), 0)
                const pct = total > 0 ? ((ps._sum.amount || 0) / total) * 100 : 0
                return (
                  <div key={ps.paymentType} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{PAYMENT_LABELS[ps.paymentType] || ps.paymentType}</span>
                      <span className="text-muted-foreground">
                        {(ps._sum.amount || 0).toLocaleString('fr-FR')} FCFA ({ps._count})
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun paiement enregistré</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Enrollments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Inscriptions récentes</CardTitle>
            <CardDescription>Derniers élèves inscrits</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentEnrollments && stats.recentEnrollments.length > 0 ? (
              <div className="space-y-3">
                {stats.recentEnrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {e.student.firstName} {e.student.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{e.class.name}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(e.enrolledAt).toLocaleDateString('fr-FR')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune inscription récente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.view}
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                onClick={() => setCurrentView(action.view)}
              >
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
