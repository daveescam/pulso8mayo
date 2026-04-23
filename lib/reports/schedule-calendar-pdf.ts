/**
 * Schedule Calendar PDF Export
 * 
 * Exports shift schedules to PDF format for printing and distribution
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { LFTConflict } from '@/lib/services/lft-conflict-detector';

interface ShiftSchedule {
    userId: string;
    userName: string;
    date: Date;
    startTime: string;
    endTime: string;
    workHours: number;
    branchName?: string;
}

export class ScheduleCalendarPDF {
    /**
     * Export schedule calendar to PDF
     */
    static async exportToPDF(
        schedules: ShiftSchedule[],
        title: string = 'Calendario de Turnos',
        dateRange: { start: Date; end: Date },
        conflicts?: LFTConflict[]
    ): Promise<void> {
        const doc = new jsPDF('landscape');

        // Header
        doc.setFontSize(20);
        doc.text(title, 14, 20);

        doc.setFontSize(10);
        doc.text(
            `Período: ${format(dateRange.start, 'dd/MM/yyyy')} - ${format(dateRange.end, 'dd/MM/yyyy')}`,
            14,
            28
        );
        doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 33);

        // Group schedules by employee
        const byEmployee = this.groupByEmployee(schedules);
        const employees = Object.keys(byEmployee);

        // Create weekly schedule table
        const weekDays = eachDayOfInterval({
            start: dateRange.start,
            end: dateRange.end,
        });

        // Build table data
        const tableData = employees.map(userId => {
            const employeeShifts = byEmployee[userId];
            const row: any = {
                employee: employeeShifts[0]?.userName || userId,
            };

            weekDays.forEach(day => {
                const shift = employeeShifts.find(s => isSameDay(s.date, day));
                if (shift) {
                    row[format(day, 'yyyy-MM-dd')] = `${shift.startTime}\n${shift.endTime}`;
                } else {
                    row[format(day, 'yyyy-MM-dd')] = 'DESCANSO';
                }
            });

            return row;
        });

        // Build headers
        const tableHeaders = [
            { header: 'Empleado', dataKey: 'employee' },
            ...weekDays.map(day => ({
                header: format(day, 'EEE dd', { locale: es }),
                dataKey: format(day, 'yyyy-MM-dd'),
            })),
        ];

        // Add schedule table
        autoTable(doc, {
            startY: 40,
            head: [tableHeaders.map(h => h.header)],
            body: tableData.map(row => 
                tableHeaders.map(h => row[h.dataKey as keyof typeof row] || '')
            ),
            styles: {
                fontSize: 8,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [243, 244, 246],
            },
            didParseCell: (data) => {
                // Highlight rest days
                if (data.section === 'body' && data.column.index > 0) {
                    const cellText = data.cell.raw;
                    if (cellText === 'DESCANSO') {
                        data.cell.styles.fillColor = [220, 252, 231];
                        data.cell.styles.textColor = [22, 101, 52];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            },
        });

        // Add conflicts section if any
        if (conflicts && conflicts.length > 0) {
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            
            doc.setFontSize(14);
            doc.setTextColor(220, 38, 38);
            doc.text('⚠️ Conflictos LFT Detectados', 14, finalY);
            doc.setTextColor(0, 0, 0);

            const conflictData = conflicts.map(c => [
                c.userName,
                c.type,
                c.severity,
                c.description,
                c.article,
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Empleado', 'Tipo', 'Severidad', 'Descripción', 'Artículo']],
                body: conflictData,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [220, 38, 38] },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 2) {
                        const severity = data.cell.raw;
                        if (severity === 'MUY_GRAVE') {
                            data.cell.styles.fillColor = [254, 202, 202];
                            data.cell.styles.textColor = [127, 29, 29];
                        } else if (severity === 'GRAVE') {
                            data.cell.styles.fillColor = [253, 224, 71];
                            data.cell.styles.textColor = [113, 63, 18];
                        }
                    }
                },
            });
        }

        // Add summary
        const summaryY = conflicts && conflicts.length > 0
            ? (doc as any).lastAutoTable.finalY + 10
            : (doc as any).lastAutoTable.finalY + 10;

        doc.setFontSize(12);
        doc.text('Resumen', 14, summaryY);

        doc.setFontSize(10);
        doc.text(`Total de Empleados: ${employees.length}`, 14, summaryY + 8);
        doc.text(`Total de Turnos: ${schedules.length}`, 14, summaryY + 15);
        
        if (conflicts) {
            doc.text(`Conflictos LFT: ${conflicts.length}`, 14, summaryY + 22);
            doc.text(`  - Muy Graves: ${conflicts.filter(c => c.severity === 'MUY_GRAVE').length}`, 14, summaryY + 29);
            doc.text(`  - Graves: ${conflicts.filter(c => c.severity === 'GRAVE').length}`, 14, summaryY + 36);
            doc.text(`  - Leves: ${conflicts.filter(c => c.severity === 'LEVE').length}`, 14, summaryY + 43);
        }

        // Save PDF
        doc.save(`calendario-turnos-${format(dateRange.start, 'yyyy-MM-dd')}.pdf`);
    }

    /**
     * Group schedules by employee
     */
    private static groupByEmployee(schedules: ShiftSchedule[]): Record<string, ShiftSchedule[]> {
        const grouped: Record<string, ShiftSchedule[]> = {};

        schedules.forEach(schedule => {
            if (!grouped[schedule.userId]) {
                grouped[schedule.userId] = [];
            }
            grouped[schedule.userId].push(schedule);
        });

        return grouped;
    }
}
