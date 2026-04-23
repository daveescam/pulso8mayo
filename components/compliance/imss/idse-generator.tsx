'use client';

import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Loader2, FileText, UserPlus, UserMinus, DollarSign, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  userId: string;
  name: string;
  nss: string;
  curp: string;
  rfc: string;
  department: string;
  baseSalary: number;
  hireDate: string;
  employeeNumber: string;
  selected: boolean;
}

export function IDSEGenerator() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [registroPatronal, setRegistroPatronal] = useState('');
  const [movementType, setMovementType] = useState<string>('08');
  const [companyId, setCompanyId] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          setCompanyId(data.user?.companyId || '');
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/employees?companyId=${companyId}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          setEmployees(data.employees?.map((e: any) => ({
            userId: e.userId || e.id,
            name: e.userName || e.name || 'Sin nombre',
            nss: e.nss || '',
            curp: e.curp || '',
            rfc: e.rfc || '',
            department: e.department || '',
            baseSalary: (e.baseSalary || 0) / 100,
            hireDate: e.hireDate || '',
            employeeNumber: e.employeeNumber || '',
            selected: false,
          })) || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  const toggleEmployee = (index: number) => {
    setEmployees(prev => prev.map((e, i) => i === index ? { ...e, selected: !e.selected } : e));
  };

  const toggleAll = () => {
    const allSelected = employees.every(e => e.selected);
    setEmployees(prev => prev.map(e => ({ ...e, selected: !allSelected })));
  };

  const generateIDSE = () => {
    if (!registroPatronal) {
      toast({ title: 'Error', description: 'Ingresa el registro patronal', variant: 'destructive' });
      return;
    }

    const selected = employees.filter(e => e.selected && e.nss && e.nss.length === 11);
    if (selected.length === 0) {
      toast({ title: 'Error', description: 'Selecciona al menos un empleado con NSS válido', variant: 'destructive' });
      return;
    }

    // Generate IDSE batch file
    const lines: string[] = [];
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Header
    lines.push(`HD|${registroPatronal.padEnd(11, ' ')}|${selected.length.toString().padStart(5, '0')}|${today}|PULSO_SISTEMA`);

    // Detail lines
    for (const emp of selected) {
      const nameParts = emp.name.split(' ');
      const sdiFactor = 1.0452;
      const sdi = Math.round(emp.baseSalary * sdiFactor * 100) / 100;
      const sdiCents = Math.round(sdi * 100).toString().padStart(7, '0');

      const hireDateFormatted = emp.hireDate
        ? new Date(emp.hireDate).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '')
        : today.slice(6, 8) + today.slice(4, 6) + today.slice(0, 4);

      lines.push([
        'DT',
        emp.nss.padStart(11, '0'),
        emp.curp.padEnd(18, ' '),
        emp.rfc.padEnd(13, ' '),
        (nameParts[0] || '').toUpperCase().padEnd(27, ' '),
        (nameParts[1] || '').toUpperCase().padEnd(27, ' '),
        (nameParts.slice(2).join(' ') || '').toUpperCase().padEnd(27, ' '),
        sdiCents,
        movementType,
        hireDateFormatted,
        '1', // Tipo trabajador permanente
        '1', // Jornada normal
        '00000000', // Fecha baja (vacío si es alta)
      ].join('|'));
    }

    // Trailer
    lines.push(`TR|${selected.length.toString().padStart(5, '0')}`);

    const content = lines.join('\r\n');

    // Download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const movLabel = movementType === '08' ? 'ALTAS' : movementType === '02' ? 'BAJAS' : 'MOD_SALARIO';
    a.download = `IDSE_${movLabel}_${registroPatronal}_${today}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Archivo IDSE generado',
      description: `${selected.length} movimientos de tipo ${movLabel}`,
    });
  };

  const selectedCount = employees.filter(e => e.selected).length;
  const validSelected = employees.filter(e => e.selected && e.nss && e.nss.length === 11).length;

  const movementConfig: Record<string, { label: string; icon: any; color: string }> = {
    '08': { label: 'Alta (Registro)', icon: UserPlus, color: 'text-green-600' },
    '02': { label: 'Baja (Desregistro)', icon: UserMinus, color: 'text-red-600' },
    '07': { label: 'Modificación de Salario', icon: DollarSign, color: 'text-blue-600' },
  };

  const currentConfig = movementConfig[movementType] || movementConfig['08'];
  const MovIcon = currentConfig.icon;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Generador IDSE — Movimientos ante IMSS
          </CardTitle>
          <CardDescription>
            Genera archivos batch para altas, bajas y modificaciones salariales ante el IDSE del IMSS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="idse-registro">Registro Patronal *</Label>
              <Input
                id="idse-registro"
                placeholder="Ej: Y6012345108"
                value={registroPatronal}
                onChange={(e) => setRegistroPatronal(e.target.value)}
                maxLength={11}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08">08 — Alta (Registro)</SelectItem>
                  <SelectItem value="02">02 — Baja (Desregistro)</SelectItem>
                  <SelectItem value="07">07 — Modificación de Salario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="outline" className={`flex items-center gap-1 h-10 px-4 ${currentConfig.color}`}>
                <MovIcon className="h-4 w-4" />
                {currentConfig.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedCount} seleccionados ({validSelected} con NSS válido)
            </div>
            <Button onClick={generateIDSE} disabled={loading || validSelected === 0}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Generar IDSE ({validSelected} movimientos)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Selection */}
      {employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Empleados</CardTitle>
            <CardDescription>Marca los empleados a incluir en el archivo IDSE</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={employees.length > 0 && employees.every(e => e.selected)}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>NSS</TableHead>
                  <TableHead>CURP</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead className="text-right">Salario Diario</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp, i) => (
                  <TableRow key={i} className={emp.selected ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={emp.selected}
                        onCheckedChange={() => toggleEmployee(i)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell className="font-mono">{emp.nss || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{emp.curp || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{emp.rfc || '-'}</TableCell>
                    <TableCell className="text-right">${emp.baseSalary.toFixed(2)}</TableCell>
                    <TableCell>
                      {emp.nss && emp.nss.length === 11 ? (
                        <Badge variant="default">Válido</Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Sin NSS
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
