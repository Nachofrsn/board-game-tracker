'use client'

import * as React from 'react'
import { LayoutGrid, BarChart3 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SiteHeader } from '@/components/board/site-header'
import { GroupsPanel } from '@/components/board/groups-panel'
import { GroupDetail } from '@/components/board/group-detail'
import { GlobalDashboard } from '@/components/board/global-dashboard'

export default function Page() {
  const [tab, setTab] = React.useState('grupos')
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null)

  function openGroup(id: string) {
    setSelectedGroup(id)
    setTab('grupos')
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="grupos">
              <LayoutGrid data-icon="inline-start" />
              Grupos
            </TabsTrigger>
            <TabsTrigger value="dashboard">
              <BarChart3 data-icon="inline-start" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grupos">
            {selectedGroup ? (
              <GroupDetail groupId={selectedGroup} onBack={() => setSelectedGroup(null)} />
            ) : (
              <GroupsPanel onOpenGroup={openGroup} />
            )}
          </TabsContent>

          <TabsContent value="dashboard">
            <GlobalDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
