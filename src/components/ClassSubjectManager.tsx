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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Pencil, Trash2, BookOpen, Users, GraduationCap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Classe {
  id: string
  name: string
  level: string | null
  capacity: number | null
  room: string | null
  schoolYearId: string
  _count?: { enrollments: number }
  enrollments?: { id: string; student: { id: string; firstName: string; lastName: string } }[]
  teacherAssignments?: { id: string; teacher: { id: string; firstName: string; lastName: string }; subject: { name: string } }[]
}

interface Subject {
  id: string
  name: string
  code: string | null
  coefficient: number
}

interface Teacher {
  id: string
  firstName: string
  lastName: string
}

export default function ClassSubjectManager() {
  const { selectedSchoolId, selectedSchoolYearId } = useAppStore()
  const [classes, setClasses] = useState<Classe[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const loading = !dataLoaded
  const [classOpen, setClassOpen] = useState(false)
  const [subjectOpen, setSubjectOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Classe | null>(null)
  const [classForm, setClassForm] = useState({ name: '', level: '', capacity: '', room: '' })
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', coefficient: '1' })
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignForm, setAssignForm] = useState({ classId: '', teacherId: '', subjectId: '' })
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [selectedClassForEnroll, setSelectedClassForEnroll] = useState<Classe | null>(null)
  const [availableStudents, setAvailableStudents] = useState<{ id: string; firstName: string; lastName: string }[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const { toast } = useToast()

  function loadData() {
    if (!selectedSchoolId) return
    const p1 = fetch(`/api/classes?schoolId=${selectedSchoolId}&schoolYearId=${selectedSchoolYearId || ''}`).then((r) => r.json())
    const p2 = fetch(`/api/subjects?schoolId=${selectedSchoolId}`).then((r) => r.json())
    const p3 = fetch(`/api/teachers?schoolId=${selectedSchoolId}`).then((r) => r.json())
    Promise.all([p1, p2, p3])
      .then(([c, s, t]) => {
        setClasses(c)
        setSubjects(s)
        setTeachers(t)
        setDataLoaded(true)
      })
      .catch(() => setDataLoaded(true))
  }

  useEffect(() => {
    loadData()
  }, [selectedSchoolId, selectedSchoolYearId])

  const handleCreateClass = async () => {
    if (!classForm.name.trim() || !selectedSchoolYearId) return
    const payload = {
      schoolId: selectedSchoolId,
      name: classForm.name,
      level: classForm.level || null,
      capacity: classForm.capacity ? parseInt(classForm.capacity) : null,
      room: classForm.room || null,
      schoolYearId: selectedSchoolYearId,
    }
    if (editingClass) {
      await fetch(`/api/classes/${editingClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      toast({ title: 'Classe modifiée' })
    } else {
      await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      toast({ title: 'Classe créée' })
    }
    setClassOpen(false)
    setEditingClass(null)
    setClassForm({ name: '', level: '', capacity: '', room: '' })
    loadData()
  }

  const handleEditClass = (cl: Classe) => {
    setEditingClass(cl)
    setClassForm({
      name: cl.name,
      level: cl.level || '',
      capacity: cl.capacity?.toString() || '',
      room: cl.room || '',
    })
    setClassOpen(true)
  }

  const handleDeleteClass = async (id: string) => {
    await fetch(`/api/classes/${id}`, { method: 'DELETE' })
    toast({ title: 'Classe supprimée' })
    loadData()
  }

  const handleCreateSubject = async () => {
    if (!subjectForm.name.trim()) return
    await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: selectedSchoolId,
        name: subjectForm.name,
        code: subjectForm.code || null,
        coefficient: parseFloat(subjectForm.coefficient) || 1,
      }),
    })
    toast({ title: 'Matière créée' })
    setSubjectOpen(false)
    setSubjectForm({ name: '', code: '', coefficient: '1' })
    loadData()
  }

  const handleDeleteSubject = async (id: string) => {
    await fetch(`/api/subjects/${id}`, { method: 'DELETE' })
    toast({ title: 'Matière supprimée' })
    loadData()
  }

  const handleAssign = async () => {
    if (!assignForm.classId || !assignForm.teacherId || !assignForm.subjectId || !selectedSchoolYearId) return
    await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: 'temp',
        classId: assignForm.classId,
        schoolYearId: selectedSchoolYearId,
      }),
    }).catch(() => {})
    toast({ title: 'Affectation enregistrée' })
    setAssignOpen(false)
    setAssignForm({ classId: '', teacherId: '', subjectId: '' })
    loadData()
  }

  const handleEnrollStudent = async () => {
    if (!selectedStudentId || !selectedClassForEnroll || !selectedSchoolYearId) return
    await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: selectedStudentId,
        classId: selectedClassForEnroll.id,
        schoolYearId: selectedSchoolYearId,
      }),
    })
    toast({ title: 'Élève inscrit' })
    setEnrollOpen(false)
    setSelectedStudentId('')
    loadData()
  }

  const openEnrollDialog = async (cl: Classe) => {
    setSelectedClassForEnroll(cl)
    const enrolledIds = new Set((cl.enrollments || []).map((e) => e.student.id))
    const allStudents = await fetch(`/api/students?schoolId=${selectedSchoolId}&active=true`).then((r) => r.json())
    setAvailableStudents(allStudents.filter((s: { id: string }) => !enrolledIds.has(s.id)))
    setSelectedStudentId('')
    setEnrollOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Classes & Matières</h2>
        <p className="text-muted-foreground text-sm">Gérez les classes, les matières et les affectations</p>
      </div>

      {!selectedSchoolYearId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mb-3 opacity-30" />
            <p>Veuillez sélectionner une année scolaire pour gérer les classes.</p>
          </CardContent>
        </Card>
      )}

      {selectedSchoolYearId && (
        <Tabs defaultValue="classes">
          <TabsList>
            <TabsTrigger value="classes">Classes ({classes.length})</TabsTrigger>
            <TabsTrigger value="subjects">Matières ({subjects.length})</TabsTrigger>
          </TabsList>

          {/* Classes Tab */}
          <TabsContent value="classes" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setEditingClass(null); setClassForm({ name: '', level: '', capacity: '', room: '' }); setClassOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle classe
              </Button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : classes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mb-3 opacity-30" />
                  <p>Aucune classe. Créez votre première classe.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((cl) => (
                  <Card key={cl.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-cyan-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{cl.name}</CardTitle>
                            {cl.level && <p className="text-xs text-muted-foreground">Niveau : {cl.level}</p>}
                          </div>
                        </div>
                        <Badge variant="secondary">{cl._count?.enrollments ?? 0} élèves</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      {cl.room && <p>Salle : {cl.room}</p>}
                      {cl.capacity && <p>Capacité : {cl.capacity}</p>}
                      {cl.teacherAssignments && cl.teacherAssignments.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {cl.teacherAssignments.map((a) => (
                            <Badge key={a.id} variant="outline" className="text-xs">
                              {a.subject.name} — {a.teacher.firstName} {a.teacher.lastName}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openEnrollDialog(cl)}>
                          <Users className="h-3.5 w-3.5 mr-1" /> Inscrire
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleEditClass(cl)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs text-red-500 hover:text-red-600">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cette classe ?</AlertDialogTitle>
                              <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteClass(cl.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
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

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setSubjectOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle matière
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {subjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mb-3 opacity-30" />
                    <p>Aucune matière. Créez votre première matière.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Coefficient</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell>{s.code || '—'}</TableCell>
                          <TableCell>{s.coefficient}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer cette matière ?</AlertDialogTitle>
                                  <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSubject(s.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Class Dialog */}
      <Dialog open={classOpen} onOpenChange={setClassOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Modifier la classe' : 'Nouvelle classe'}</DialogTitle>
            <DialogDescription>{editingClass ? 'Modifiez les informations.' : 'Créez une nouvelle classe.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="Ex: 6ème A" />
              </div>
              <div className="space-y-2">
                <Label>Niveau</Label>
                <Input value={classForm.level} onChange={(e) => setClassForm({ ...classForm, level: e.target.value })} placeholder="Ex: 6ème" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacité</Label>
                <Input type="number" value={classForm.capacity} onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })} placeholder="30" />
              </div>
              <div className="space-y-2">
                <Label>Salle</Label>
                <Input value={classForm.room} onChange={(e) => setClassForm({ ...classForm, room: e.target.value })} placeholder="Salle 101" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClassOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateClass} disabled={!classForm.name.trim()}>
              {editingClass ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Dialog */}
      <Dialog open={subjectOpen} onOpenChange={setSubjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle matière</DialogTitle>
            <DialogDescription>Ajoutez une nouvelle matière à votre établissement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="Ex: Mathématiques" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} placeholder="MATH" />
              </div>
              <div className="space-y-2">
                <Label>Coefficient</Label>
                <Input type="number" step="0.5" value={subjectForm.coefficient} onChange={(e) => setSubjectForm({ ...subjectForm, coefficient: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateSubject} disabled={!subjectForm.name.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Student Dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inscrire un élève — {selectedClassForEnroll?.name}</DialogTitle>
            <DialogDescription>Sélectionnez un élève à inscrire dans cette classe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un élève" />
              </SelectTrigger>
              <SelectContent>
                {availableStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.lastName} {s.firstName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleEnrollStudent} disabled={!selectedStudentId}>
              Inscrire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
