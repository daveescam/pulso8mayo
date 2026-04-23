'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, ArrowLeft, Edit, Send, CheckCircle, Clock, User, Calendar } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReviewDetail {
  id: string;
  userId: string;
  reviewerId: string;
  reviewType: string;
  reviewPeriod: string;
  reviewDate: string;
  status: string;
  overallRating: number | null;
  strengths: string | null;
  areasForImprovement: string | null;
  developmentPlan: string | null;
  comments: string | null;
  goals: any;
  achievements: any;
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  userName: string | null;
  reviewerName: string | null;
}

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const reviewId = params.id as string;

  useEffect(() => {
    const fetchReview = async () => {
      try {
        // Fetch from the reviews list and find the matching one
        const res = await fetch(`/api/performance/reviews?companyId=all`);
        if (res.ok) {
          const data = await res.json();
          const found = data.reviews?.find((r: any) => r.id === reviewId);
          if (found) {
            setReview(found);
          }
        }
      } catch (e) {
        console.error('Error fetching review:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [reviewId]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/performance/reviews?id=${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast({ title: 'Estado actualizado', description: `Evaluación marcada como ${newStatus}` });
        // Refresh data
        const data = await res.json();
        setReview(prev => prev ? { ...prev, ...data.review } : null);
      }
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado', variant: 'destructive' });
    }
  };

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    DRAFT: { label: 'Borrador', variant: 'outline', icon: Clock },
    IN_PROGRESS: { label: 'En Progreso', variant: 'secondary', icon: Clock },
    SUBMITTED: { label: 'Enviado', variant: 'default', icon: Send },
    COMPLETED: { label: 'Completado', variant: 'default', icon: CheckCircle },
  };

  const typeLabels: Record<string, string> = {
    SELF: 'Autoevaluación',
    MANAGER: 'Evaluación de Manager',
    PEER: 'Evaluación de Par',
    '360': 'Evaluación 360',
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando evaluación...</div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-muted-foreground">Evaluación no encontrada</div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[review.status] || statusConfig.DRAFT;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Evaluación de Desempeño</h1>
            <p className="text-muted-foreground">
              {typeLabels[review.reviewType] || review.reviewType} — {review.reviewPeriod}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Empleado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{review.userName || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Evaluador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{review.reviewerName || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fecha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {format(new Date(review.reviewDate), 'dd MMM yyyy', { locale: es })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calificación General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${star <= (review.overallRating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                    }`}
                />
              ))}
              <span className="ml-2 font-bold text-lg">
                {review.overallRating ? `${review.overallRating}/5` : '-'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {review.strengths && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✓ Fortalezas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{review.strengths}</p>
            </CardContent>
          </Card>
        )}

        {review.areasForImprovement && (
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-600">△ Áreas de Mejora</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{review.areasForImprovement}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {review.developmentPlan && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Plan de Desarrollo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{review.developmentPlan}</p>
          </CardContent>
        </Card>
      )}

      {review.comments && (
        <Card>
          <CardHeader>
            <CardTitle>💬 Comentarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{review.comments}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Separator />
      <div className="flex justify-end gap-3">
        {review.status === 'DRAFT' && (
          <>
            <Button variant="outline" onClick={() => handleStatusChange('IN_PROGRESS')}>
              Marcar En Progreso
            </Button>
            <Button onClick={() => handleStatusChange('SUBMITTED')}>
              <Send className="mr-2 h-4 w-4" /> Enviar Evaluación
            </Button>
          </>
        )}
        {review.status === 'IN_PROGRESS' && (
          <Button onClick={() => handleStatusChange('SUBMITTED')}>
            <Send className="mr-2 h-4 w-4" /> Enviar Evaluación
          </Button>
        )}
        {review.status === 'SUBMITTED' && (
          <Button onClick={() => handleStatusChange('COMPLETED')}>
            <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Completada
          </Button>
        )}
      </div>
    </div>
  );
}
