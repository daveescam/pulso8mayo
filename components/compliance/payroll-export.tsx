'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Loader2, FileSpreadsheet, Eye, DollarSign, Clock, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PayrollRecord {
  employeeNumber: string;
  name: string;
  rfc: string;
  department: string;
  position: string;
  baseSalaryDaily: number;
  daysWorked: number;
  regularHours: number;
  overtimeHours: number;
  vacationDays: number;
  sickDays: number;
  otherLeaveDays: number;
  netWorkDays: number;
}

interface PayrollSummary {
  totalEmployees: number;
  totalDaysWorked: number;
  totalOvertimeHours: number;
  totalVacationDays: number;
  totalLeaveDays: number;
}

export function PayrollExport({ companyId }: { companyId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);

  // Default to current bi-weekly period
  const now = new Date();
  const day = now.getDate();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const defaultStart = day <= 15
    ? `${year}-${month}-01`
    : `${year}-${month}-16`;
  const defaultEnd = day <= 15
    ? `${year}-${month}-15`
    : `${year}-${month}-${new Date(year, now.getMonth() + 1, 0).getDate()}`;

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [format, setFormat] = useState<string>('generic');

  const handlePreview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payroll/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, startDate, endDate, format }),
      });

      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setSummary(data.summary || null);
        toast({ title: 'Datos cargados', description: `${data.records?.length || 0} empleados encontrados` });
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/export?output=csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, startDate, endDate, format }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const formatLabel = format === 'contpaqi' ? 'CONTPAQi' : format === 'noi' ? 'NOI' : 'General';
        a.download = `nomina_${formatLabel}_${startDate}_${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast({ title: 'CSV descargado', description: 'El archivo se descargó correctamente' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Error al descargar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportación de Nómina
          </CardTitle>
          <CardDescription>
            Consolida datos de turnos, incidencias y salarios para exportar a tu sistema de nómina
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start-date">Fecha Inicio</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Fecha Fin</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Formato de Exportación</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generic">CSV Genérico</SelectItem>
                  <SelectItem value="contpaqi">CONTPAQi Nóminas</SelectItem>
                  <SelectItem value="noi">Aspel NOI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handlePreview} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              Vista Previa
            </Button>
            <Button variant="secondary" onClick={handleDownload} disabled={loading || records.length === 0}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Descargar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Empleados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{summary.totalEmployees}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Días Trabajados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{summary.totalDaysWorked}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Horas Extra</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{summary.totalOvertimeHours.toFixed(1)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Días Vacaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalVacationDays}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Días Permiso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalLeaveDays}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Table */}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa ({records.length} empleados)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Empleado</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead className="text-right">Salario Diario</TableHead>
                    <TableHead className="text-right">Días Trabajados</TableHead>
                    <TableHead className="text-right">Hrs Extra</TableHead>
                    <TableHead className="text-right">Vacaciones</TableHead>
                    <TableHead className="text-right">Faltas</TableHead>
                    <TableHead className="text-right">Días Netos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono">{r.employeeNumber || '-'}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.department || '-'}</TableCell>
                      <TableCell className="text-right">${r.baseSalaryDaily.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{r.daysWorked}</TableCell>
                      <TableCell className="text-right">
                        {r.overtimeHours > 0 ? (
                          <Badge variant="secondary">{r.overtimeHours.toFixed(1)}h</Badge>
                        ) : '0'}
                      </TableCell>
                      <TableCell className="text-right">{r.vacationDays}</TableCell>
                      <TableCell className="text-right">{r.sickDays + r.otherLeaveDays}</TableCell>
                      <TableCell className="text-right font-bold">{r.netWorkDays}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
