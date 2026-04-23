'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

interface IncidentAlertProps {
    incident: {
        id: string;
        severity: 'CRITICAL' | 'WARNING' | 'FATAL';
        title: string;
        description?: string;
        status: 'DETECTED' | 'IN_REMEDIATION' | 'RESOLVED' | 'ESCALATED';
        remediationProtocol?: any;
    };
    onRemediate?: () => void;
    onDismiss?: () => void;
}

const severityConfig = {
    CRITICAL: {
        icon: XCircle,
        variant: 'destructive' as const,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
    },
    WARNING: {
        icon: AlertTriangle,
        variant: 'default' as const,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
    },
    FATAL: {
        icon: AlertCircle,
        variant: 'destructive' as const,
        color: 'text-red-800',
        bgColor: 'bg-red-100',
    },
};

const statusConfig = {
    DETECTED: { label: 'Detected', color: 'bg-red-100 text-red-800' },
    IN_REMEDIATION: { label: 'In Remediation', color: 'bg-yellow-100 text-yellow-800' },
    RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
    ESCALATED: { label: 'Escalated', color: 'bg-orange-100 text-orange-800' },
};

export function IncidentAlert({ incident, onRemediate, onDismiss }: IncidentAlertProps) {
    const config = severityConfig[incident.severity];
    const Icon = config.icon;
    const statusInfo = statusConfig[incident.status];

    return (
        <Alert variant={config.variant} className={`${config.bgColor} border-l-4 border-l-current`}>
            <Icon className="h-5 w-5" />
            <div className="flex items-start justify-between w-full">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTitle className="mb-0">{incident.title}</AlertTitle>
                        <Badge variant="outline" className={statusInfo.color}>
                            {statusInfo.label}
                        </Badge>
                        <Badge variant="outline">{incident.severity}</Badge>
                    </div>
                    {incident.description && (
                        <AlertDescription className="mt-2 text-sm">
                            {incident.description}
                        </AlertDescription>
                    )}
                </div>
                <div className="flex gap-2 ml-4">
                    {incident.remediationProtocol && incident.status !== 'RESOLVED' && onRemediate && (
                        <Button size="sm" variant="outline" onClick={onRemediate}>
                            Start Remediation
                        </Button>
                    )}
                    {onDismiss && (
                        <Button size="sm" variant="ghost" onClick={onDismiss}>
                            Dismiss
                        </Button>
                    )}
                </div>
            </div>
        </Alert>
    );
}
