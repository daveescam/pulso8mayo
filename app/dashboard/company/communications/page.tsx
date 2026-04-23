'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnnouncementCard } from '@/components/communications/announcement-card';
import { AnnouncementForm } from '@/components/communications/announcement-form';
import { Megaphone, Plus, Pin, List, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  communicationType: string;
  targetType: string;
  status: string;
  isPinned: boolean;
  sentAt: string | null;
  createdAt: string;
  authorName: string | null;
  readCount: number;
  totalRecipients: number;
}

export default function CommunicationsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [stats, setStats] = useState({ total: 0, pinned: 0, announcements: 0, messages: 0 });

  const fetchAnnouncements = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await fetch(`/api/communications/announcements?companyId=${companyId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        const items = data.announcements || [];
        setAnnouncements(items);
        setStats({
          total: items.length,
          pinned: items.filter((a: Announcement) => a.isPinned).length,
          announcements: items.filter((a: Announcement) => a.communicationType === 'ANNOUNCEMENT').length,
          messages: items.filter((a: Announcement) => a.communicationType === 'MESSAGE').length,
        });
      }
    } catch (e) {
      console.error('Error fetching announcements:', e);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    // Get user info
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          setCompanyId(data.user?.companyId || '');
          setUserId(data.user?.id || '');
        }
      } catch (e) {
        console.error('Error fetching user:', e);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (companyId) fetchAnnouncements();
  }, [companyId, fetchAnnouncements]);

  const handlePin = async (id: string, pinned: boolean) => {
    try {
      const res = await fetch(`/api/communications/announcements?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: pinned }),
      });
      if (res.ok) {
        toast({ title: pinned ? 'Anuncio fijado' : 'Anuncio desfijado' });
        fetchAnnouncements();
      }
    } catch (e) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este anuncio?')) return;
    try {
      const res = await fetch(`/api/communications/announcements?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Anuncio eliminado' });
        fetchAnnouncements();
      }
    } catch (e) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Comunicaciones</h1>
            <p className="text-muted-foreground">
              Gestiona anuncios y comunicados para tu equipo
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Anuncio
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Comunicaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fijados</CardTitle>
            <Pin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pinned}</div>
            <p className="text-xs text-muted-foreground">Anuncios fijados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anuncios</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.announcements}</div>
            <p className="text-xs text-muted-foreground">Tipo anuncio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages}</div>
            <p className="text-xs text-muted-foreground">Tipo mensaje</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && companyId && (
        <AnnouncementForm
          companyId={companyId}
          userId={userId}
          onSuccess={() => {
            setShowForm(false);
            fetchAnnouncements();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pinned">Fijados</TabsTrigger>
          <TabsTrigger value="announcements">Anuncios</TabsTrigger>
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : announcements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay comunicaciones aún</p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  Crear primer anuncio
                </Button>
              </CardContent>
            </Card>
          ) : (
            announcements.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                onPin={handlePin}
                onDelete={handleDelete}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="pinned" className="space-y-4">
          {announcements.filter(a => a.isPinned).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay anuncios fijados</div>
          ) : (
            announcements.filter(a => a.isPinned).map((a) => (
              <AnnouncementCard key={a.id} announcement={a} onPin={handlePin} onDelete={handleDelete} />
            ))
          )}
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          {announcements.filter(a => a.communicationType === 'ANNOUNCEMENT').map((a) => (
            <AnnouncementCard key={a.id} announcement={a} onPin={handlePin} onDelete={handleDelete} />
          ))}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          {announcements.filter(a => a.communicationType === 'MESSAGE').map((a) => (
            <AnnouncementCard key={a.id} announcement={a} onPin={handlePin} onDelete={handleDelete} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
