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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BarChart3, Save, Printer, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Classe {
  id: string
  name: string
  enrollments?: { student: { id: string; firstName: string; lastName: string } }[]
}

interface Subject {
  id: string
  name: string
  coefficient: number
}

interface GradeRow {
  studentId: string
  studentName: string
  score: string
  maxScore: string
  comment: string
}

interface GradeResult {
  id: string
  studentId: string
  subjectId: string
  classId: string | null
  trimester: number
  examType: string
  score: number
  maxScore: number
  comment: string | null
  date: string
  student: { firstName: string; lastName: string }
  subject: { name: string }
}

interface BulletinEntry {
  student: { firstName: string; lastName: string }
  subject: string
  coefficient: number
  trimester: number
  scores: { score: number; maxScore: number; examType: string }[]
  average: number
}

export default function GradeManager() {
  const { selectedSchoolId, selectedSchoolYearId } = useAppStore()
  const [classes, setClasses] = useState<Classe[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTrimester, setSelectedTrimester] = useState('1')
  const [examType, setExamType] = useState('devoir')
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([])
  const [gradesFetched, setGradesFetched] = useState<string | null>(null)
  const loading = selectedClass && selectedSubject && selectedSchoolYearId && gradesFetched !== `${selectedClass}-${selectedSubject}-${selectedTrimester}`
  const [saving, setSaving] = useState(false)
  const [existingGrades, setExistingGrades] = useState<GradeResult[]>([])
  const [showBulletin, setShowBulletin] = useState(false)
  const [bulletinClass, setBulletinClass] = useState('')
  const [bulletinData, setBulletinData] = useState<BulletinEntry[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (!selectedSchoolId) return
    fetch(`/api/classes?schoolId=${selectedSchoolId}&schoolYearId=${selectedSchoolYearId || ''}`)
      .then((r) => r.json())
      .then(setClasses)
    fetch(`/api/subjects?schoolId=${selectedSchoolId}`)
      .then((r) => r.json())
      .then(setSubjects)
  }, [selectedSchoolId, selectedSchoolYearId])

  useEffect(() => {
    if (!selectedClass || !selectedSubject || !selectedSchoolYearId) return
    const key = `${selectedClass}-${selectedSubject}-${selectedTrimester}`
    let cancelled = false
    fetch(
      `/api/grades?schoolYearId=${selectedSchoolYearId}&classId=${selectedClass}&subjectId=${selectedSubject}&trimester=${selectedTrimester}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setExistingGrades(data)
          setGradesFetched(key)
        }
      })
    return () => { cancelled = true }
  }, [selectedClass, selectedSubject, selectedSchoolYearId, selectedTrimester])

  useEffect(() => {
    if (!selectedClass) return
    let cancelled = false
    const cl = classes.find((c) => c.id === selectedClass)
    if (cl && cl.enrollments) {
      const rows = cl.enrollments.map((e) => {
        const existing = existingGrades.find(
          (g) => g.studentId === e.student.id && g.examType === examType
        )
        return {
          studentId: e.student.id,
          studentName: `${e.student.lastName} ${e.student.firstName}`,
          score: existing ? existing.score.toString() : '',
          maxScore: existing ? existing.maxScore.toString() : '20',
          comment: existing?.comment || '',
        }
      })
      const timer = setTimeout(() => {
        if (!cancelled) setGradeRows(rows)
      }, 0)
      return () => { cancelled = true; clearTimeout(timer) }
    }
    return () => { cancelled = true }
  }, [selectedClass, classes, existingGrades, examType])

  const updateRow = (index: number, field: keyof GradeRow, value: string) => {
    const newRows = [...gradeRows]
    newRows[index] = { ...newRows[index], [field]: value }
    setGradeRows(newRows)
  }

  const handleSave = async () => {
    if (!selectedSchoolYearId) return
    setSaving(true)
    for (const row of gradeRows) {
      if (!row.score.trim()) continue
      await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: row.studentId,
          subjectId: selectedSubject,
          schoolYearId: selectedSchoolYearId,
          classId: selectedClass,
          trimester: parseInt(selectedTrimester),
          examType,
          score: parseFloat(row.score),
          maxScore: parseFloat(row.maxScore) || 20,
          comment: row.comment || null,
        }),
      })
    }
    setSaving(false)
    toast({ title: 'Notes enregistrées', description: `${gradeRows.filter((r) => r.score.trim()).length} notes sauvegardées.` })
  }

  const generateBulletin = async () => {
    if (!bulletinClass || !selectedSchoolYearId) return
    const allGrades = await fetch(
      `/api/grades?schoolYearId=${selectedSchoolYearId}&classId=${bulletinClass}&trimester=${selectedTrimester}`
    ).then((r) => r.json())

    const grouped: Record<string, BulletinEntry> = {}
    for (const g of allGrades) {
      const key = `${g.studentId}-${g.subjectId}`
      if (!grouped[key]) {
        grouped[key] = {
          student: { firstName: g.student.firstName, lastName: g.student.lastName },
          subject: g.subject.name,
          coefficient: subjects.find((s) => s.id === g.subjectId)?.coefficient || 1,
          trimester: g.trimester,
          scores: [],
          average: 0,
        }
      }
      grouped[key].scores.push({ score: g.score, maxScore: g.maxScore, examType: g.examType })
    }

    const results = Object.values(grouped).map((entry) => {
      const totalScore = entry.scores.reduce((s, sc) => s + (sc.score / sc.maxScore) * 20, 0)
      entry.average = entry.scores.length > 0 ? totalScore / entry.scores.length : 0
      return entry
    })

    setBulletinData(results)
    setShowBulletin(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notes & Bulletins</h2>
        <p className="text-muted-foreground text-sm">Saisissez les notes et générez les bulletins</p>
      </div>

      {!selectedSchoolYearId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
            <p>Veuillez sélectionner une année scolaire.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="entry">
          <TabsList>
            <TabsTrigger value="entry">Saisie des notes</TabsTrigger>
            <TabsTrigger value="bulletin">Bulletins</TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="mt-4 space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Classe</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Matière</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Trimestre</Label>
                    <Select value={selectedTrimester} onValueChange={setSelectedTrimester}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Trimestre 1</SelectItem>
                        <SelectItem value="2">Trimestre 2</SelectItem>
                        <SelectItem value="3">Trimestre 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type d&apos;évaluation</Label>
                    <Select value={examType} onValueChange={setExamType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="devoir">Devoir</SelectItem>
                        <SelectItem value="examen">Examen</SelectItem>
                        <SelectItem value="controle">Contrôle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grade Entry Table */}
            {selectedClass && selectedSubject && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Saisie des notes</CardTitle>
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-6 space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : gradeRows.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun élève inscrit dans cette classe.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Élève</TableHead>
                            <TableHead className="w-24">Note /20</TableHead>
                            <TableHead className="w-24">Bareme</TableHead>
                            <TableHead className="hidden md:table-cell">Commentaire</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {gradeRows.map((row, idx) => (
                            <TableRow key={row.studentId}>
                              <TableCell className="font-medium">{row.studentName}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.25"
                                  min="0"
                                  max="20"
                                  value={row.score}
                                  onChange={(e) => updateRow(idx, 'score', e.target.value)}
                                  className="w-20 h-8"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={row.maxScore}
                                  onChange={(e) => updateRow(idx, 'maxScore', e.target.value)}
                                  className="w-20 h-8"
                                />
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Input
                                  value={row.comment}
                                  onChange={(e) => updateRow(idx, 'comment', e.target.value)}
                                  className="h-8"
                                  placeholder="Commentaire..."
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bulletin Tab */}
          <TabsContent value="bulletin" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-2 flex-1">
                    <Label>Classe</Label>
                    <Select value={bulletinClass} onValueChange={setBulletinClass}>
                      <SelectTrigger><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Trimestre</Label>
                    <Select value={selectedTrimester} onValueChange={setSelectedTrimester}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Trimestre 1</SelectItem>
                        <SelectItem value="2">Trimestre 2</SelectItem>
                        <SelectItem value="3">Trimestre 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={generateBulletin}>
                    <FileText className="h-4 w-4 mr-2" />
                    Générer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {showBulletin && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Bulletin — Trimestre {selectedTrimester}</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimer
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {bulletinData.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground">Aucune note disponible pour ce bulletin.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Élève</TableHead>
                            <TableHead>Matière</TableHead>
                            <TableHead>Coeff.</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Moyenne</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bulletinData.map((entry, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {entry.student.lastName} {entry.student.firstName}
                              </TableCell>
                              <TableCell>{entry.subject}</TableCell>
                              <TableCell>{entry.coefficient}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {entry.scores.map((s, si) => (
                                    <Badge key={si} variant={s.score >= 10 ? 'default' : 'destructive'} className="text-xs">
                                      {s.score}/{s.maxScore}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={entry.average >= 10 ? 'default' : 'destructive'}>
                                  {entry.average.toFixed(2)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
