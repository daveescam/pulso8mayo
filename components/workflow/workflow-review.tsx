"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Eye, Download, Calendar, User, MapPin, AlertTriangle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface WorkflowReviewData {
  id: string;
  templateName: string;
  assigneeName: string | null;
  branchName: string | null;
  status: string;
  score: number | null;
  createdAt: Date;
  completedAt: Date | null;
  steps: Array<{
    id: string;
    stepId: string;
    title: string;
    type: string;
    status: string;
    value: any;
    evidenceUrl: string | null;
    aiAnalysis: any | null;
    comment: string | null;
    completedAt: Date | null;
  }>;
}

export interface WorkflowReviewProps {
  workflow: WorkflowReviewData;
  onApprove?: (workflowId: string, comment: string) => void;
  onReject?: (workflowId: string, comment: string) => void;
  className?: string;
}

export function WorkflowReview({
  workflow,
  onApprove,
  onReject,
  className
}: WorkflowReviewProps) {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [reviewComment, setReviewComment] = React.useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false);
  const [reviewAction, setReviewAction] = React.useState<'approve' | 'reject' | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const evidenceSteps = workflow.steps.filter(s => s.evidenceUrl);
  const aiVerifiedSteps = workflow.steps.filter(s => s.aiAnalysis && s.aiAnalysis.passed);
  const aiFailedSteps = workflow.steps.filter(s => s.aiAnalysis && !s.aiAnalysis.passed);

  const handleReviewSubmit = async () => {
    if (!reviewAction) return;

    setSubmitting(true);
    try {
      if (reviewAction === 'approve') {
        await onApprove?.(workflow.id, reviewComment);
        toast.success('Workflow aprobado exitosamente');
      } else {
        await onReject?.(workflow.id, reviewComment);
        toast.success('Workflow rechazado');
      }
      setReviewDialogOpen(false);
      setReviewComment("");
      setReviewAction(null);
    } catch (error: any) {
      toast.error('Error al procesar la revisión', {
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewDialog = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const getEvidenceUrls = (evidenceUrl: string | null): string[] => {
    if (!evidenceUrl) return [];
    try {
      if (evidenceUrl.startsWith('[')) {
        return JSON.parse(evidenceUrl);
      }
      return [evidenceUrl];
    } catch {
      return [evidenceUrl];
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Workflow Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{workflow.templateName}</CardTitle>
              <CardDescription className="mt-1">
                Completado el {workflow.completedAt ? new Date(workflow.completedAt).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}
              </CardDescription>
            </div>
            <Badge
              variant={workflow.status === 'COMPLETED' ? 'default' : 'secondary'}
              className="text-sm"
            >
              {workflow.status === 'COMPLETED' ? 'Completado' : workflow.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Asignado a</div>
                <div className="font-medium">{workflow.assigneeName || 'Sin asignar'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Sucursal</div>
                <div className="font-medium">{workflow.branchName || 'N/A'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Creado</div>
                <div className="font-medium">{new Date(workflow.createdAt).toLocaleDateString('es-MX')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Puntuación</div>
                <div className="font-medium">{workflow.score !== null ? `${workflow.score}%` : 'N/A'}</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* AI Verification Summary */}
      {(aiVerifiedSteps.length > 0 || aiFailedSteps.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verificación AI</CardTitle>
            <CardDescription>
              Resumen de verificación automática por inteligencia artificial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiVerifiedSteps.length > 0 && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-900 dark:text-green-100">
                    {aiVerifiedSteps.length} paso(s) verificado(s)
                  </AlertTitle>
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Estos pasos fueron verificados exitosamente por AI
                  </AlertDescription>
                </Alert>
              )}

              {aiFailedSteps.length > 0 && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertTitle className="text-red-900 dark:text-red-100">
                    {aiFailedSteps.length} paso(s) con fallas
                  </AlertTitle>
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    Estos pasos requieren revisión manual
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence Gallery */}
      {evidenceSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Galería de Evidencias</CardTitle>
            <CardDescription>
              {evidenceSteps.length} paso(s) con evidencia fotográfica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {evidenceSteps.map((step, index) => {
                const urls = getEvidenceUrls(step.evidenceUrl);
                return urls.map((url, urlIndex) => (
                  <div
                    key={`${step.id}-${urlIndex}`}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={() => setSelectedImage(url)}
                  >
                    <img
                      src={url}
                      alt={`${step.title} - Evidencia ${urlIndex + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-xs text-white font-medium mb-1">
                          Paso {index + 1}: {step.title}
                        </p>
                        {step.aiAnalysis && (
                          <Badge
                            variant={step.aiAnalysis.passed ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {step.aiAnalysis.passed ? '✓ AI Verified' : '✗ AI Failed'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ));
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle de Pasos</CardTitle>
          <CardDescription>
            Información completa de cada paso del workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Todos ({workflow.steps.length})</TabsTrigger>
              <TabsTrigger value="evidence">Con Evidencia ({evidenceSteps.length})</TabsTrigger>
              <TabsTrigger value="ai-verified">AI Verified ({aiVerifiedSteps.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {workflow.steps.map((step, index) => (
                <StepDetail key={step.id} step={step} index={index} />
              ))}
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4 mt-4">
              {evidenceSteps.length > 0 ? (
                evidenceSteps.map((step, index) => (
                  <StepDetail key={step.id} step={step} index={index} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay pasos con evidencia
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai-verified" className="space-y-4 mt-4">
              {aiVerifiedSteps.length > 0 ? (
                aiVerifiedSteps.map((step, index) => (
                  <StepDetail key={step.id} step={step} index={index} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay pasos verificados por AI
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Revisión del Workflow</CardTitle>
          <CardDescription>
            Aprueba o rechaza el workflow completo
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => openReviewDialog('reject')}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Rechazar
          </Button>
          <Button
            onClick={() => openReviewDialog('approve')}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Aprobar
          </Button>
        </CardFooter>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vista Previa de Evidencia</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative aspect-video">
              <img
                src={selectedImage}
                alt="Evidencia"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => window.open(selectedImage || '', '_blank')}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar
            </Button>
            <Button onClick={() => setSelectedImage(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Comment Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Aprobar Workflow' : 'Rechazar Workflow'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve'
                ? '¿Estás seguro de aprobar este workflow? Puedes agregar un comentario opcional.'
                : '¿Estás seguro de rechazar este workflow? Por favor proporciona una razón.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                Comentario {reviewAction === 'reject' ? '*' : '(opcional)'}
              </Label>
              <Textarea
                placeholder="Agrega tu comentario aquí..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="min-h-[100px]"
                required={reviewAction === 'reject'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReviewSubmit}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              disabled={submitting || (reviewAction === 'reject' && !reviewComment.trim())}
            >
              {submitting ? 'Procesando...' : reviewAction === 'approve' ? 'Aprobar' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StepDetailProps {
  step: WorkflowReviewData['steps'][0];
  index: number;
}

function StepDetail({ step, index }: StepDetailProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              variant={step.status === 'COMPLETED' ? 'default' : step.status === 'SKIPPED' ? 'secondary' : 'destructive'}
            >
              Paso {index + 1}
            </Badge>
            <span className="font-medium">{step.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {step.aiAnalysis && (
              <Badge
                variant={step.aiAnalysis.passed ? 'outline' : 'destructive'}
                className="text-xs"
              >
                {step.aiAnalysis.passed ? '✓ AI' : '✗ AI'}
              </Badge>
            )}
            {step.evidenceUrl && (
              <Badge variant="secondary" className="gap-1">
                <Eye className="h-3 w-3" />
                Evidencia
              </Badge>
            )}
          </div>
        </div>
        {step.comment && (
          <p className="text-sm text-muted-foreground mt-2">
            {step.comment}
          </p>
        )}
      </div>

      {expanded && (
        <>
          <Separator />
          <CardContent className="p-4 space-y-3">
            {step.value && (
              <div>
                <Label className="text-sm font-medium">Valor:</Label>
                <p className="text-sm mt-1">{String(step.value)}</p>
              </div>
            )}

            {step.evidenceUrl && (
              <div>
                <Label className="text-sm font-medium">Evidencia:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {(() => {
                    try {
                      const urls = step.evidenceUrl.startsWith('[')
                        ? JSON.parse(step.evidenceUrl)
                        : [step.evidenceUrl];
                      return urls.map((url: string, idx: number) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Evidencia ${idx + 1}`}
                          className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(url, '_blank')}
                        />
                      ));
                    } catch {
                      return (
                        <img
                          src={step.evidenceUrl!}
                          alt="Evidencia"
                          className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(step.evidenceUrl!, '_blank')}
                        />
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            {step.aiAnalysis && (
              <div>
                <Label className="text-sm font-medium">Análisis AI:</Label>
                <Alert
                  className={cn(
                    "mt-2",
                    step.aiAnalysis.passed
                      ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20'
                      : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
                  )}
                >
                  {step.aiAnalysis.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <AlertTitle>
                    {step.aiAnalysis.passed ? 'Verificación Exitosa' : 'Verificación Fallida'}
                  </AlertTitle>
                  <AlertDescription>
                    {step.aiAnalysis.reason}
                    {step.aiAnalysis.confidence && (
                      <span className="block mt-1 text-xs">
                        Confianza: {Math.round(step.aiAnalysis.confidence * 100)}%
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {step.completedAt && (
              <div className="text-xs text-muted-foreground">
                Completado: {new Date(step.completedAt).toLocaleString('es-MX')}
              </div>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}
