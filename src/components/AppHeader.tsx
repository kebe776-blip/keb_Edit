'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, Menu, Wifi, WifiOff, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function AppHeader() {
  const { selectedSchoolId, isOnline, sidebarOpen, setSidebarOpen } = useAppStore()
  const [schoolName, setSchoolName] = useState<string>('')
  const [yearLabel, setYearLabel] = useState<string>('')

  useEffect(() => {
    if (selectedSchoolId) {
      fetch(`/api/schools/${selectedSchoolId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.name) setSchoolName(data.name)
        })
    }
  }, [selectedSchoolId])

  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 gap-4">
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold truncate text-foreground">
          {schoolName || 'EduGest - Gestion Scolaire'}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Online indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted">
          {isOnline ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={`text-xs font-medium ${isOnline ? 'text-emerald-600' : 'text-red-500'}`}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-emerald-600 text-white text-xs">
                  <User className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Mon profil</DropdownMenuItem>
            <DropdownMenuItem>Paramètres</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
