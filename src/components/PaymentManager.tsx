'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Wallet, Search, Receipt } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Payment {
  id: string
  studentId: string
  amount: number
  paymentType: string
  method: string
  reference: string | null
  description: string | null
  date: string
  student: { firstName: string; lastName: string }
  schoolYear: { label: string }
}

interface Student {
  id: string
  firstName: string
  lastName: string
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  inscription: 'Inscription',
  scolarite: 'Scolarité',
  autre: 'Autre',
}

const METHOD_LABELS: Record<string, string> = {
  especes: 'Espèces',
  cheque: 'Chèque',
  virement: 'Virement',
}

export default function PaymentManager() {
  const { selectedSchoolId, selectedSchoolYearId } = useAppStore()
  const [payments, setPayments] = useState<Payment[] | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const loading = payments === null
  const [open, setOpen] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [form, setForm] = useState({
    studentId: '',
    amount: '',
    paymentType: 'inscription',
    method: 'especes',
    reference: '',
    description: '',
  })
  const { toast } = useToast()

  function loadPayments() {
    if (!selectedSchoolId || !selectedSchoolYearId) return
    const params = new URLSearchParams({
      schoolId: selectedSchoolId,
      schoolYearId: selectedSchoolYearId,
    })
    if (filterType) params.set('paymentType', filterType)
    fetch(`/api/payments?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPayments(data)
      })
      .catch(() => setPayments([]))
  }

  useEffect(() => {
    loadPayments()
  }, [selectedSchoolId, selectedSchoolYearId, filterType])

  useEffect(() => {
    if (selectedSchoolId) {
      fetch(`/api/students?schoolId=${selectedSchoolId}&active=true`)
        .then((r) => r.json())
        .then(setStudents)
    }
  }, [selectedSchoolId])

  const totalAmount = (payments ?? []).reduce((s, p) => s + p.amount, 0)

  const handleCreate = async () => {
    if (!form.studentId || !form.amount) return
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: form.studentId,
        schoolYearId: selectedSchoolYearId,
        schoolId: selectedSchoolId,
        amount: parseFloat(form.amount),
        paymentType: form.paymentType,
        method: form.method,
        reference: form.reference || null,
        description: form.description || null,
      }),
    })
    toast({ title: 'Paiement enregistré' })
    setOpen(false)
    setForm({ studentId: '', amount: '', paymentType: 'inscription', method: 'especes', reference: '', description: '' })
    loadPayments()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Paiements</h2>
          <p className="text-muted-foreground text-sm">{(payments ?? []).length} paiements — Total : {totalAmount.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau paiement
        </Button>
      </div>

      {!selectedSchoolYearId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Wallet className="h-12 w-12 mb-3 opacity-30" />
            <p>Veuillez sélectionner une année scolaire.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">Inscriptions</p>
                <p className="text-xl font-bold text-emerald-600">
                  {(payments ?? []).filter((p) => p.paymentType === 'inscription').reduce((s, p) => s + p.amount, 0).toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-xs text-muted-foreground">
                  {(payments ?? []).filter((p) => p.paymentType === 'inscription').length} paiements
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">Scolarité</p>
                <p className="text-xl font-bold text-teal-600">
                  {(payments ?? []).filter((p) => p.paymentType === 'scolarite').reduce((s, p) => s + p.amount, 0).toLocaleString('fr-FR')} FCFA
                </p>
                <p className="text-xs text-muted-foreground">
                  {(payments ?? []).filter((p) => p.paymentType === 'scolarite').length} paiements
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{totalAmount.toLocaleString('fr-FR')} FCFA</p>
                <p className="text-xs text-muted-foreground">{(payments ?? []).length} transactions</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex gap-3">
            <Select value={filterType} onValueChange={(v) => setFilterType(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tous les types</SelectItem>
                <SelectItem value="inscription">Inscription</SelectItem>
                <SelectItem value="scolarite">Scolarité</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (payments ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mb-3 opacity-30" />
                  <p>Aucun paiement enregistré.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Élève</TableHead>
                        <TableHead className="hidden sm:table-cell">Type</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead className="hidden md:table-cell">Méthode</TableHead>
                        <TableHead className="hidden md:table-cell">Référence</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(payments ?? []).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.student.lastName} {p.student.firstName}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline">{PAYMENT_TYPE_LABELS[p.paymentType] || p.paymentType}</Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-600">
                            {p.amount.toLocaleString('fr-FR')} FCFA
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {METHOD_LABELS[p.method] || p.method}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {p.reference || '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(p.date).toLocaleDateString('fr-FR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Payment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau paiement</DialogTitle>
            <DialogDescription>Enregistrez un nouveau paiement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Élève *</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un élève" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.lastName} {s.firstName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Montant (FCFA) *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.paymentType} onValueChange={(v) => setForm({ ...form, paymentType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inscription">Inscription</SelectItem>
                    <SelectItem value="scolarite">Scolarité</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Méthode</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="especes">Espèces</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="virement">Virement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Référence</Label>
              <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="N° de reçu" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description optionnelle" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreate} disabled={!form.studentId || !form.amount}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
