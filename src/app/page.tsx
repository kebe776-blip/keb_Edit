'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { installOfflineFetch } from '@/lib/fetch-wrapper'
import { syncManager } from '@/lib/sync-manager'
import AppSidebar from '@/components/AppSidebar'
import AppHeader from '@/components/AppHeader'
import Dashboard from '@/components/Dashboard'
import SchoolManager from '@/components/SchoolManager'
import SchoolYearManager from '@/components/SchoolYearManager'
import StudentManager from '@/components/StudentManager'
import TeacherManager from '@/components/TeacherManager'
import ClassSubjectManager from '@/components/ClassSubjectManager'
import GradeManager from '@/components/GradeManager'
import PaymentManager from '@/components/PaymentManager'

const viewComponents: Record<string, React.ReactNode> = {
  dashboard: <Dashboard />,
  schools: <SchoolManager />,
  'school-years': <SchoolYearManager />,
  students: <StudentManager />,
  teachers: <TeacherManager />,
  'classes-subjects': <ClassSubjectManager />,
  grades: <GradeManager />,
  payments: <PaymentManager />,
}

export default function Home() {
  const { currentView, sidebarOpen, setOnline } = useAppStore()

  useEffect(() => {
    // Install offline fetch interceptor (enhanced fetch with cache + sync)
    installOfflineFetch()

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[SW] Service Worker registered:', reg.scope)
      }).catch((err) => {
        console.log('[SW] Service Worker registration failed:', err)
      })
    }

    // Online/offline detection
    const goOnline = () => {
      setOnline(true)
      syncManager.updateStatus(true)
    }
    const goOffline = () => {
      setOnline(false)
      syncManager.updateStatus(false)
    }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    setOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      syncManager.stopAutoSync()
    }
  }, [setOnline])

  return (
    <div className="min-h-screen flex flex-col">
      <AppSidebar />
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {viewComponents[currentView] || <Dashboard />}
        </main>
      </div>
    </div>
  )
}
