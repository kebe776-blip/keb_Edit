'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
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
import { Search, Plus, Pencil, Trash2, UserCheck, Mail, Phone, BookOpen } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Teacher {
  id: string
  schoolId: string
  firstName: string
  lastName: string
  phone: string | null
  email: string | null
  subject: string | null
  address: string | null
  isActive: boolean
  teacherAssignments?: { class: { name: string }; subject: { name: string }; schoolYear: { label: string } }[]
}

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  subject: '',
  address: '',
}

export default function TeacherManager() {
  const { selectedSchoolId } = useAppStore()
  const [teachers, setTeachers] = useState<Teacher[] | null>(null)
  const loading = teachers === null
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [form, setForm] = useState(emptyForm)
  const { toast } = useToast()

  function loadTeachers() {
    if (!selectedSchoolId) return
    const params = new URLSearchParams({ schoolId: selectedSchoolId })
    if (search) params.set('search', search)
    fetch(`/api/teachers?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setTeachers(data)
      })
      .catch(() => setTeachers([]))
  }

  useEffect(() => {
    loadTeachers()
  }, [selectedSchoolId, search])

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return
    const payload = { ...form, schoolId: selectedSchoolId }
    if (editing) {
      await fetch(`/api/teachers/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      toast({ title: 'Enseignant modifié' })
    } else {
      await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      toast({ title: 'Enseignant ajouté' })
    }
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    loadTeachers()
  }

  const handleEdit = (teacher: Teacher) => {
    setEditing(teacher)
    setForm({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      phone: teacher.phone || '',
      email: teacher.email || '',
      subject: teacher.subject || '',
      address: teacher.address || '',
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/teachers/${id}`, { method: 'DELETE' })
    toast({ title: 'Enseignant supprimé' })
    loadTeachers()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Enseignants</h2>
          <p className="text-muted-foreground text-sm">{(teachers ?? []).length} enseignants trouvés</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel enseignant
        </Button>
      </div>

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
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (teachers ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <UserCheck className="h-12 w-12 mb-3 opacity-30" />
              <p>Aucun enseignant trouvé.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom complet</TableHead>
                    <TableHead className="hidden sm:table-cell">Spécialité</TableHead>
                    <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                    <TableHead className="hidden lg:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Classes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(teachers ?? []).map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                            <UserCheck className="h-4 w-4 text-teal-600" />
                          </div>
                          <div>
                            <p className="font-medium">{teacher.lastName} {teacher.firstName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {teacher.subject ? <Badge variant="outline">{teacher.subject}</Badge> : '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{teacher.phone || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">{teacher.email || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {teacher.teacherAssignments && teacher.teacherAssignments.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {teacher.teacherAssignments.slice(0, 3).map((a, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{a.class.name}</Badge>
                            ))}
                            {teacher.teacherAssignments.length > 3 && (
                              <Badge variant="secondary" className="text-xs">+{teacher.teacherAssignments.length - 3}</Badge>
                            )}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(teacher)}>
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
                                <AlertDialogTitle>Supprimer cet enseignant ?</AlertDialogTitle>
                                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(teacher.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
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

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(emptyForm) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier l\'enseignant' : 'Nouvel enseignant'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Modifiez les informations.' : 'Remplissez les informations du nouvel enseignant.'}
            </DialogDescription>
          </DialogHeader>
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
                <Label>Spécialité</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ex: Mathématiques" />
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Adresse" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); setForm(emptyForm) }}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={!form.firstName.trim() || !form.lastName.trim()}>
              {editing ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
