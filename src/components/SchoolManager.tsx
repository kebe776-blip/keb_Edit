'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { School, Plus, Pencil, Trash2, MapPin, Phone, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SchoolItem {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  description: string | null
  isActive: boolean
  students: { id: string }[]
  teachers: { id: string }[]
  classes: { id: string }[]
}

const emptyForm = {
  name: '',
  address: '',
  phone: '',
  email: '',
  description: '',
}

export default function SchoolManager() {
  const [schools, setSchools] = useState<SchoolItem[] | null>(null)
  const loading = schools === null
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SchoolItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const { toast } = useToast()

  function loadSchools() {
    fetch('/api/schools')
      .then((r) => r.json())
      .then((data) => {
        setSchools(data)
      })
      .catch(() => setSchools([]))
  }

  useEffect(() => {
    loadSchools()
  }, [])

  const handleSubmit = async () => {
    if (!form.name.trim()) return

    if (editing) {
      await fetch(`/api/schools/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      toast({ title: 'Établissement modifié', description: 'Les modifications ont été enregistrées.' })
    } else {
      await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      toast({ title: 'Établissement créé', description: 'Le nouvel établissement a été ajouté.' })
    }

    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    loadSchools()
  }

  const handleEdit = (school: SchoolItem) => {
    setEditing(school)
    setForm({
      name: school.name,
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || '',
      description: school.description || '',
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/schools/${id}`, { method: 'DELETE' })
    toast({ title: 'Établissement supprimé', description: 'L\'établissement a été supprimé.' })
    loadSchools()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Établissements</h2>
          <p className="text-muted-foreground text-sm">Gérez vos établissements scolaires</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(emptyForm) } }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel établissement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier l\'établissement' : 'Nouvel établissement'}</DialogTitle>
              <DialogDescription>
                {editing ? 'Modifiez les informations de l\'établissement.' : 'Remplissez les informations du nouvel établissement.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom de l'établissement" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Adresse" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); setForm(emptyForm) }}>Annuler</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={!form.name.trim()}>
                {editing ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (schools ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <School className="h-12 w-12 mb-3 opacity-30" />
            <p>Aucun établissement. Créez votre premier établissement.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(schools ?? []).map((school) => (
            <Card key={school.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <School className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{school.name}</CardTitle>
                      <Badge variant={school.isActive ? 'default' : 'secondary'} className="mt-1 text-xs">
                        {school.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {school.address && (
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{school.address}</div>
                )}
                {school.phone && (
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{school.phone}</div>
                )}
                {school.email && (
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{school.email}</div>
                )}
                <div className="flex items-center gap-4 pt-2 border-t mt-3">
                  <span className="text-xs">{school.students?.length ?? 0} élèves</span>
                  <span className="text-xs">{school.teachers?.length ?? 0} enseignants</span>
                  <span className="text-xs">{school.classes?.length ?? 0} classes</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(school)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Modifier
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cet établissement ?</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible. Toutes les données associées seront supprimées.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(school.id)} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
