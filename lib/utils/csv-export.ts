/**
 * CSV Export Utility
 * 
 * Helper functions for exporting data to CSV format
 */

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV(
    data: any[],
    filename: string,
    headers?: string[]
): void {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Use provided headers or extract from first object
    const csvHeaders = headers || Object.keys(data[0]);
    
    // Build CSV rows
    const csvRows = data.map(row =>
        csvHeaders.map(header => {
            const value = row[header];
            // Handle null/undefined
            if (value === null || value === undefined) {
                return '';
            }
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(value).replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
                ? `"${escaped}"`
                : escaped;
        }).join(',')
    );

    // Combine headers and rows
    const csv = [csvHeaders.join(','), ...csvRows].join('\n');
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    // Cleanup
    URL.revokeObjectURL(url);
}

/**
 * Export KPI data to CSV
 */
export function exportKPIToCSV(
    kpis: any[],
    filename: string = 'kpi-report'
): void {
    const data = kpis.map(kpi => ({
        'KPI Name': kpi.name,
        'Category': kpi.category,
        'Current Value': kpi.currentValue,
        'Target': kpi.target || 'N/A',
        'Status': kpi.status,
        'Unit': kpi.unit || '',
        'Previous Value': kpi.previousValue || 'N/A',
        'Trend': kpi.previousValue 
            ? (((kpi.currentValue - kpi.previousValue) / kpi.previousValue) * 100).toFixed(2) + '%'
            : 'N/A',
    }));

    exportToCSV(data, filename);
}

/**
 * Export inventory data to CSV
 */
export function exportInventoryToCSV(
    items: any[],
    filename: string = 'inventory-report'
): void {
    const data = items.map(item => ({
        'Product': item.name,
        'SKU': item.sku || 'N/A',
        'Category': item.category || 'N/A',
        'Current Stock': item.currentStock || 0,
        'Min Level': item.minLevel || 0,
        'Max Level': item.maxLevel || 'N/A',
        'Unit': item.unit,
        'Status': item.currentStock < item.minLevel ? 'LOW STOCK' : 'OK',
        'Last Cost': item.lastCost ? `$${(item.lastCost / 100).toFixed(2)}` : 'N/A',
    }));

    exportToCSV(data, filename);
}

/**
 * Export labor data to CSV
 */
export function exportLaborToCSV(
    sessions: any[],
    filename: string = 'labor-report'
): void {
    const data = sessions.map(session => ({
        'Employee': session.userName,
        'Branch': session.branchName,
        'Date': new Date(session.startedAt).toLocaleDateString('es-MX'),
        'Start Time': new Date(session.startedAt).toLocaleTimeString('es-MX'),
        'End Time': session.endedAt ? new Date(session.endedAt).toLocaleTimeString('es-MX') : 'N/A',
        'Work Minutes': session.totalWorkMinutes || 0,
        'Break Minutes': session.totalBreakMinutes || 0,
        'Overtime Minutes': session.overtimeMinutes || 0,
        'Late Minutes': session.lateMinutes || 0,
        'Compliance Issues': session.complianceFlags ? Object.keys(session.complianceFlags).join(', ') : 'None',
    }));

    exportToCSV(data, filename);
}

/**
 * Export workflow data to CSV
 */
export function exportWorkflowToCSV(
    workflows: any[],
    filename: string = 'workflow-report'
): void {
    const data = workflows.map(wf => ({
        'Workflow': wf.templateName,
        'Status': wf.status,
        'Assignee': wf.assigneeName || 'Unassigned',
        'Branch': wf.branchName,
        'Started': wf.startedAt ? new Date(wf.startedAt).toLocaleDateString('es-MX') : 'N/A',
        'Completed': wf.completedAt ? new Date(wf.completedAt).toLocaleDateString('es-MX') : 'N/A',
        'Score': wf.score ? `${wf.score}%` : 'N/A',
        'Steps Completed': `${wf.completedSteps}/${wf.totalSteps}`,
    }));

    exportToCSV(data, filename);
}
