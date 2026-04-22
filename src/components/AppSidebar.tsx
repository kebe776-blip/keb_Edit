'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LayoutDashboard,
  School,
  CalendarDays,
  GraduationCap,
  UserCheck,
  BookOpen,
  BarChart3,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface School {
  id: string
  name: string
}

interface SchoolYear {
  id: string
  label: string
  isActive: boolean
}

const navItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'schools', label: 'Établissements', icon: School },
  { id: 'school-years', label: 'Années scolaires', icon: CalendarDays },
  { id: 'students', label: 'Élèves', icon: GraduationCap },
  { id: 'teachers', label: 'Enseignants', icon: UserCheck },
  { id: 'classes-subjects', label: 'Classes & Matières', icon: BookOpen },
  { id: 'grades', label: 'Notes & Bulletins', icon: BarChart3 },
  { id: 'payments', label: 'Paiements', icon: Wallet },
]

export default function AppSidebar() {
  const {
    selectedSchoolId,
    selectedSchoolYearId,
    currentView,
    sidebarOpen,
    setSelectedSchool,
    setSelectedSchoolYear,
    setCurrentView,
    toggleSidebar,
  } = useAppStore()

  const [schools, setSchools] = useState<School[]>([])
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([])

  useEffect(() => {
    fetch('/api/schools')
      .then((r) => r.json())
      .then((data) => {
        setSchools(data)
        if (data.length > 0 && !selectedSchoolId) {
          setSelectedSchool(data[0].id)
        }
      })
  }, [])

  useEffect(() => {
    if (selectedSchoolId) {
      fetch(`/api/school-years?schoolId=${selectedSchoolId}`)
        .then((r) => r.json())
        .then((data) => {
          setSchoolYears(data)
          const activeYear = data.find((y: SchoolYear) => y.isActive)
          if (activeYear && !selectedSchoolYearId) {
            setSelectedSchoolYear(activeYear.id)
          }
        })
    }
  }, [selectedSchoolId, selectedSchoolYearId, setSelectedSchoolYear])

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-sm shrink-0">
          EG
        </div>
        {sidebarOpen && (
          <span className="font-bold text-lg text-sidebar-foreground truncate">
            EduGest
          </span>
        )}
      </div>

      {/* School & Year Selectors */}
      <div className="px-2 py-3 space-y-2">
        {sidebarOpen && (
          <>
            <Select value={selectedSchoolId ?? ''} onValueChange={(v) => setSelectedSchool(v)}>
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-xs">
                <SelectValue placeholder="Choisir un établissement" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSchoolYearId ?? ''} onValueChange={(v) => setSelectedSchoolYear(v)}>
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-xs">
                <SelectValue placeholder="Choisir une année" />
              </SelectTrigger>
              <SelectContent>
                {schoolYears
                  .filter((y) => y.isActive)
                  .map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start gap-3 h-10 px-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-emerald-400'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                onClick={() => setCurrentView(item.id)}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      {/* Toggle button */}
      <div className="px-2 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  )
}
