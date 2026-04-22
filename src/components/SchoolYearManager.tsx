'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CalendarDays, Plus, Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SchoolYear {
  id: string
  schoolId: string
  label: string
  startDate: string
  endDate: string
  isActive: boolean
  isArchived: boolean
  createdAt: string
}

export default function SchoolYearManager() {
  const { selectedSchoolId } = useAppStore()
  const [years, setYears] = useState<SchoolYear[] | null>(null)
  const loading = years === null
  const [dialogOpen, setDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [form, setForm] = useState({ label: '', startDate: '', endDate: '' })
  const { toast } = useToast()

  function loadYears() {
    if (!selectedSchoolId) return
    fetch(`/api/school-years?schoolId=${selectedSchoolId}`)
      .then((r) => r.json())
      .then((data) => {
        setYears(data)
      })
      .catch(() => setYears([]))
  }

  useEffect(() => {
    loadYears()
  }, [selectedSchoolId])

  const handleCreate = async () => {
    if (!form.label.trim() || !form.startDate || !form.endDate) return
    await fetch('/api/school-years', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: selectedSchoolId,
        label: form.label,
        startDate: form.startDate,
        endDate: form.endDate,
      }),
    })
    toast({ title: 'Année scolaire créée' })
    setDialogOpen(false)
    setForm({ label: '', startDate: '', endDate: '' })
    loadYears()
  }

  const handleArchiveAndCreate = async () => {
    const activeYear = years.find((y) => y.isActive)
    if (!activeYear) {
      toast({ title: 'Erreur', description: 'Aucune année active à archiver.', variant: 'destructive' })
      return
    }

    const currentLabel = activeYear.label
    const [startYear] = currentLabel.split('-')
    const nextStart = parseInt(startYear) + 1
    const nextEnd = nextStart + 1

    await fetch('/api/school-years/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: selectedSchoolId,
        currentYearId: activeYear.id,
        newYearLabel: `${nextStart}-${nextEnd}`,
        newYearStartDate: `${nextStart}-09-01`,
        newYearEndDate: `${nextEnd}-06-30`,
      }),
    })
    toast({ title: 'Nouvelle année créée', description: `L'année ${currentLabel} a été archivée. Nouvelle année : ${nextStart}-${nextEnd}` })
    setArchiveDialogOpen(false)
    loadYears()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/school-years/${id}`, { method: 'DELETE' })
    toast({ title: 'Année supprimée' })
    loadYears()
  }

  const activeYears = (years ?? []).filter((y) => !y.isArchived)
  const archivedYears = (years ?? []).filter((y) => y.isArchived)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Années scolaires</h2>
          <p className="text-muted-foreground text-sm">Gérez les années scolaires et les archives</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setArchiveDialogOpen(true)} disabled={!(years ?? []).some((y) => y.isActive)}>
            <Archive className="h-4 w-4 mr-2" />
            Nouvelle année
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Actives ({activeYears.length})</TabsTrigger>
          <TabsTrigger value="archived">Archivées ({archivedYears.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : activeYears.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mb-3 opacity-30" />
                <p>Aucune année scolaire active.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeYears.map((year) => (
                <Card key={year.id} className={year.isActive ? 'border-emerald-300 bg-emerald-50/30' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{year.label}</CardTitle>
                      <Badge variant={year.isActive ? 'default' : 'secondary'}>
                        {year.isActive ? 'En cours' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {new Date(year.startDate).toLocaleDateString('fr-FR')} — {new Date(year.endDate).toLocaleDateString('fr-FR')}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette année ?</AlertDialogTitle>
                            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(year.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          {archivedYears.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ArchiveRestore className="h-12 w-12 mb-3 opacity-30" />
                <p>Aucune année archivée.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archivedYears.map((year) => (
                <Card key={year.id} className="opacity-75">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{year.label}</CardTitle>
                      <Badge variant="outline">
                        <Archive className="h-3 w-3 mr-1" />Archivée
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {new Date(year.startDate).toLocaleDateString('fr-FR')} — {new Date(year.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle année scolaire</DialogTitle>
            <DialogDescription>Créez une nouvelle année scolaire pour votre établissement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Libellé *</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex: 2025-2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date de fin *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreate} disabled={!form.label.trim() || !form.startDate || !form.endDate}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle année scolaire</DialogTitle>
            <DialogDescription>
              L&apos;année en cours sera archivée et une nouvelle année sera automatiquement créée.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <p className="text-sm text-amber-800">
                  L&apos;année <strong>{(years ?? []).find((y) => y.isActive)?.label}</strong> sera archivée (lecture seule).
                  Les données seront conservées.
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleArchiveAndCreate}>
              Archiver et créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
