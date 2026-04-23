'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Edit, Search, Target, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PerformanceGoal {
  id: string;
  userId: string;
  companyId: string;
  branchId: string | null;
  title: string;
  description: string | null;
  category: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  targetDate: Date | null;
  completedDate: Date | null;
  metrics: any;
  createdAt: Date;
  updatedAt: Date;
  userName: string | null;
}

interface GoalsListProps {
  companyId: string;
  userId: string;
  userRole: string;
}

export function GoalsList({ companyId, userId, userRole }: GoalsListProps) {
  const router = useRouter();
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const params = new URLSearchParams({
          companyId,
          page: page.toString(),
          limit: limit.toString(),
        });

        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (search) params.set('search', search);

        const response = await fetch(`/api/performance/goals?${params}`);
        const data = await response.json();

        setGoals(data.goals || []);
        setTotal(data.pagination?.total || 0);
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [companyId, page, statusFilter, search]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      NOT_STARTED: 'outline',
      IN_PROGRESS: 'secondary',
      COMPLETED: 'default',
      CANCELLED: 'destructive',
    };

    const labels: Record<string, string> = {
      NOT_STARTED: 'No Iniciado',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar objetivos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="NOT_STARTED">No Iniciado</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Cargando...</div>
          ) : goals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No se encontraron objetivos
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Objetivo
                    </div>
                  </TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha Límite
                    </div>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{goal.title}</div>
                        {goal.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {goal.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {goal.category ? (
                        <Badge variant="outline">{goal.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {goal.targetDate ? (
                        format(new Date(goal.targetDate), 'dd MMM yyyy', { locale: es })
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(goal.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/performance/goals/${goal.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/performance/goals/${goal.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total} resultados
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
