'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Loader2, FileText, ShieldCheck, AlertTriangle } from 'lucide-react';
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
}

export function SUAGenerator() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [registroPatronal, setRegistroPatronal] = useState('');
  const [fechaMovimiento, setFechaMovimiento] = useState(
    new Date().toISOString().split('T')[0]
  );
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

  const loadEmployees = async () => {
    if (!companyId) return;
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
        })) || []);
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Error al cargar empleados', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) loadEmployees();
  }, [companyId]);

  const generateSUA = () => {
    if (!registroPatronal) {
      toast({ title: 'Error', description: 'Ingresa el registro patronal', variant: 'destructive' });
      return;
    }

    const validEmployees = employees.filter(e => e.nss && e.nss.length === 11);
    if (validEmployees.length === 0) {
      toast({ title: 'Error', description: 'No hay empleados con NSS válido', variant: 'destructive' });
      return;
    }

    // Generate SUA content using simple fixed-width format
    const lines: string[] = [];
    for (const emp of validEmployees) {
      const nameParts = emp.name.split(' ');
      const sdiFactor = 1.0452; // First year factor
      const sdi = Math.round(emp.baseSalary * sdiFactor * 100) / 100;
      const sdiCents = Math.round(sdi * 100).toString().padStart(7, '0');

      const dateFormatted = fechaMovimiento.split('-').reverse().join('');
      const hireDateFormatted = emp.hireDate
        ? new Date(emp.hireDate).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '')
        : '00000000';

      const line = [
        emp.nss.padStart(11, '0'),
        sdiCents,
        dateFormatted.padEnd(8, '0'),
        registroPatronal.padEnd(11, ' '),
        (nameParts[0] || '').toUpperCase().padEnd(27, ' '),
        (nameParts[1] || '').toUpperCase().padEnd(27, ' '),
        (nameParts.slice(2).join(' ') || nameParts[0] || '').toUpperCase().padEnd(27, ' '),
        '01', // Tipo trabajador permanente
        '01', // Jornada normal
        hireDateFormatted,
      ].join('');

      lines.push(line);
    }

    const content = lines.join('\r\n');

    // Download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SUA_${registroPatronal}_${fechaMovimiento}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Archivo SUA generado',
      description: `${validEmployees.length} registros exportados`,
    });
  };

  const employeesWithNSS = employees.filter(e => e.nss && e.nss.length === 11);
  const employeesWithoutNSS = employees.filter(e => !e.nss || e.nss.length !== 11);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            Generador SUA
          </CardTitle>
          <CardDescription>
            Genera archivos de texto plano compatibles con el Sistema Único de Autodeterminación del IMSS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="registro-patronal">Registro Patronal *</Label>
              <Input
                id="registro-patronal"
                placeholder="Ej: Y6012345108"
                value={registroPatronal}
                onChange={(e) => setRegistroPatronal(e.target.value)}
                maxLength={11}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha-mov">Fecha de Movimiento</Label>
              <Input
                id="fecha-mov"
                type="date"
                value={fechaMovimiento}
                onChange={(e) => setFechaMovimiento(e.target.value)}
              />
            </div>
          </div>

          {employeesWithoutNSS.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                {employeesWithoutNSS.length} empleado(s) sin NSS válido — no serán incluidos
              </span>
            </div>
          )}

          <Button onClick={generateSUA} disabled={loading || employeesWithNSS.length === 0}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Generar Archivo SUA ({employeesWithNSS.length} empleados)
          </Button>
        </CardContent>
      </Card>

      {employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Empleados ({employees.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
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
                  <TableRow key={i}>
                    <TableCell className="font-mono">{emp.employeeNumber || i + 1}</TableCell>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell className="font-mono">{emp.nss || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{emp.curp || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{emp.rfc || '-'}</TableCell>
                    <TableCell className="text-right">${emp.baseSalary.toFixed(2)}</TableCell>
                    <TableCell>
                      {emp.nss && emp.nss.length === 11 ? (
                        <Badge variant="default">✓ Válido</Badge>
                      ) : (
                        <Badge variant="destructive">Sin NSS</Badge>
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
