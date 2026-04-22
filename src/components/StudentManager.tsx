'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  GraduationCap,
  User,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Student {
  id: string
  schoolId: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
  gender: string
  address: string | null
  phone: string | null
  email: string | null
  parentName: string | null
  parentPhone: string | null
  isActive: boolean
  enrollments?: { class: { name: string }; schoolYear: { label: string } }[]
  grades?: { id: string; score: number; maxScore: number; subject: { name: string }; trimester: number; examType: string; date: string }[]
  payments?: { id: string; amount: number; paymentType: string; method: string; date: string; schoolYear: { label: string } }[]
}

interface Classe {
  id: string
  name: string
}

const emptyForm = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'M',
  address: '',
  phone: '',
  email: '',
  parentName: '',
  parentPhone: '',
}

export default function StudentManager() {
  const { selectedSchoolId, selectedSchoolYearId } = useAppStore()
  const [students, setStudents] = useState<Student[] | null>(null)
  const [classes, setClasses] = useState<Classe[]>([])
  const loading = students === null
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailStudent, setDetailStudent] = useState<Student | null>(null)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [enrollClassId, setEnrollClassId] = useState('')
  const { toast } = useToast()

  function loadStudents() {
    if (!selectedSchoolId) return
    const params = new URLSearchParams({ schoolId: selectedSchoolId, active: 'true' })
    if (search) params.set('search', search)
    if (selectedSchoolYearId && enrollClassId) {
      params.set('classId', enrollClassId)
      params.set('schoolYearId', selectedSchoolYearId)
    }
    fetch(`/api/students?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setStudents(data)
      })
      .catch(() => setStudents([]))
  }

  function loadClasses() {
    if (!selectedSchoolId || !selectedSchoolYearId) return
    fetch(`/api/classes?schoolId=${selectedSchoolId}&schoolYearId=${selectedSchoolYearId}`)
      .then((r) => r.json())
      .then((data) => setClasses(data))
  }

  useEffect(() => {
    loadStudents()
  }, [selectedSchoolId, search, selectedSchoolYearId, enrollClassId])

  useEffect(() => {
    loadClasses()
  }, [selectedSchoolId, selectedSchoolYearId])

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return
    const payload = { ...form, schoolId: selectedSchoolId }
    if (editing) {
      await fetch(`/api/students/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      toast({ title: 'Élève modifié' })
    } else {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      toast({ title: 'Élève ajouté' })
    }
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    loadStudents()
  }

  const handleEdit = (student: Student) => {
    setEditing(student)
    setForm({
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      gender: student.gender,
      address: student.address || '',
      phone: student.phone || '',
      email: student.email || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
    })
    setOpen(true)
  }

  const handleViewDetail = async (student: Student) => {
    const res = await fetch(`/api/students/${student.id}`)
    const data = await res.json()
    setDetailStudent(data)
    setDetailOpen(true)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/students/${id}`, { method: 'DELETE' })
    toast({ title: 'Élève supprimé' })
    loadStudents()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Élèves</h2>
          <p className="text-muted-foreground text-sm">{(students ?? []).length} élèves trouvés</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel élève
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou prénom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {classes.length > 0 && (
          <Select value={enrollClassId} onValueChange={(v) => setEnrollClassId(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Toutes les classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Toutes les classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (students ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mb-3 opacity-30" />
              <p>Aucun élève trouvé.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom complet</TableHead>
                    <TableHead className="hidden sm:table-cell">Sexe</TableHead>
                    <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                    <TableHead className="hidden md:table-cell">Parent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(students ?? []).map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium">{student.lastName} {student.firstName}</p>
                            {student.email && (
                              <p className="text-xs text-muted-foreground">{student.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={student.gender === 'M' ? 'default' : 'secondary'}>
                          {student.gender === 'M' ? 'Masculin' : 'Féminin'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{student.phone || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{student.parentName || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetail(student)} title="Détails">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(student)} title="Modifier">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer cet élève ?</AlertDialogTitle>
                                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(student.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(emptyForm) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier l\'élève' : 'Nouvel élève'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Modifiez les informations de l\'élève.' : 'Remplissez les informations du nouvel élève.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-3">
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom *</Label>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Prénom" />
                </div>
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Nom" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de naissance</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Sexe</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Adresse" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du parent/tuteur</Label>
                  <Input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} placeholder="Parent" />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone du parent</Label>
                  <Input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder="Tél. parent" />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); setForm(emptyForm) }}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={!form.firstName.trim() || !form.lastName.trim()}>
              {editing ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {detailStudent?.lastName} {detailStudent?.firstName}
            </DialogTitle>
            <DialogDescription>Fiche détaillée de l&apos;élève</DialogDescription>
          </DialogHeader>
          {detailStudent && (
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Informations</TabsTrigger>
                <TabsTrigger value="grades">Notes ({detailStudent.grades?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="payments">Paiements ({detailStudent.payments?.length ?? 0})</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Date de naissance:</span> {detailStudent.dateOfBirth ? new Date(detailStudent.dateOfBirth).toLocaleDateString('fr-FR') : '—'}</div>
                  <div><span className="text-muted-foreground">Sexe:</span> {detailStudent.gender === 'M' ? 'Masculin' : 'Féminin'}</div>
                  <div><span className="text-muted-foreground">Téléphone:</span> {detailStudent.phone || '—'}</div>
                  <div><span className="text-muted-foreground">Email:</span> {detailStudent.email || '—'}</div>
                  <div><span className="text-muted-foreground">Parent:</span> {detailStudent.parentName || '—'}</div>
                  <div><span className="text-muted-foreground">Tél. parent:</span> {detailStudent.parentPhone || '—'}</div>
                </div>
                {detailStudent.enrollments && detailStudent.enrollments.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Classes :</p>
                    <div className="flex flex-wrap gap-2">
                      {detailStudent.enrollments.map((e, i) => (
                        <Badge key={i} variant="secondary">{e.class.name} — {e.schoolYear.label}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="grades" className="mt-4">
                {detailStudent.grades && detailStudent.grades.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matière</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Trimestre</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailStudent.grades.map((g) => (
                        <TableRow key={g.id}>
                          <TableCell>{g.subject.name}</TableCell>
                          <TableCell><Badge variant={g.score >= 10 ? 'default' : 'destructive'}>{g.score}/{g.maxScore}</Badge></TableCell>
                          <TableCell>{g.examType}</TableCell>
                          <TableCell>T{g.trimester}</TableCell>
                          <TableCell>{new Date(g.date).toLocaleDateString('fr-FR')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-6">Aucune note enregistrée</p>
                )}
              </TabsContent>
              <TabsContent value="payments" className="mt-4">
                {detailStudent.payments && detailStudent.payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Montant</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailStudent.payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.amount.toLocaleString('fr-FR')} FCFA</TableCell>
                          <TableCell>{p.paymentType}</TableCell>
                          <TableCell>{p.method}</TableCell>
                          <TableCell>{new Date(p.date).toLocaleDateString('fr-FR')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-6">Aucun paiement enregistré</p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
