'use client'

import * as React from 'react'
import { LayoutGrid, BarChart3, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/board/site-header'
import { GroupsPanel } from '@/components/board/groups-panel'
import { GroupDetail } from '@/components/board/group-detail'
import { GlobalDashboard } from '@/components/board/global-dashboard'
import { FriendsPanel } from '@/components/friends/friends-panel'
import { useFriends } from '@/lib/use-friends'

export default function Page() {
  const [tab, setTab] = React.useState('grupos')
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null)
  const { incoming } = useFriends()

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
            <TabsTrigger value="amigos">
              <Users data-icon="inline-start" />
              Amigos
              {incoming.length > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-4 min-w-4 px-1 text-[10px] leading-none">
                  {incoming.length}
                </Badge>
              )}
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

          <TabsContent value="amigos">
            <FriendsPanel />
          </TabsContent>

          <TabsContent value="dashboard">
            <GlobalDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
