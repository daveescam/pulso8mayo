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
import { Eye, Edit, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PerformanceReview {
  id: string;
  userId: string;
  reviewerId: string;
  reviewType: 'SELF' | 'MANAGER' | 'PEER' | '360';
  reviewPeriod: string;
  reviewDate: Date;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'SUBMITTED';
  overallRating: number | null;
  strengths: string | null;
  areasForImprovement: string | null;
  submittedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userName: string | null;
  reviewerName: string | null;
}

interface PerformanceReviewListProps {
  companyId: string;
  userId: string;
  userRole: string;
}

export function PerformanceReviewList({ companyId, userId, userRole }: PerformanceReviewListProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const params = new URLSearchParams({
          companyId,
          page: page.toString(),
          limit: limit.toString(),
        });

        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (typeFilter !== 'all') params.set('reviewType', typeFilter);
        if (search) params.set('search', search);

        const response = await fetch(`/api/performance/reviews?${params}`);
        const data = await response.json();

        setReviews(data.reviews || []);
        setTotal(data.pagination?.total || 0);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [companyId, page, statusFilter, typeFilter, search]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      DRAFT: 'outline',
      IN_PROGRESS: 'secondary',
      COMPLETED: 'default',
      SUBMITTED: 'default',
    };

    const labels: Record<string, string> = {
      DRAFT: 'Borrador',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completado',
      SUBMITTED: 'Enviado',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SELF: 'Autoevaluación',
      MANAGER: 'Evaluación de Manager',
      PEER: 'Evaluación de Par',
      '360': 'Evaluación 360',
    };
    return labels[type] || type;
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
                placeholder="Buscar por nombre..."
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
                <SelectItem value="DRAFT">Borrador</SelectItem>
                <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="SUBMITTED">Enviado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="SELF">Autoevaluación</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="PEER">Par</SelectItem>
                <SelectItem value="360">360</SelectItem>
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
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No se encontraron evaluaciones
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">
                      {review.userName || 'N/A'}
                    </TableCell>
                    <TableCell>{getTypeLabel(review.reviewType)}</TableCell>
                    <TableCell>{review.reviewPeriod}</TableCell>
                    <TableCell>
                      {format(new Date(review.reviewDate), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      {review.overallRating ? (
                        <Badge variant="outline">
                          {review.overallRating}/5
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/performance/reviews/${review.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/performance/reviews/${review.id}/edit`)}
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
