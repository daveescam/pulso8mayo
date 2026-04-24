"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileDown, Calculator, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SUAFileGeneratorProps {
  onGenerate?: (data: SUAData) => void;
}

interface SUAData {
  period: string;
  companyId: string;
  employeeCount: number;
  totalSalary: number;
}

export function SUAFileGenerator({ onGenerate }: SUAFileGeneratorProps) {
  const [period, setPeriod] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<SUAData | null>(null);

  const handleGenerate = async () => {
    if (!period) {
      toast.error("Please select a period");
      return;
    }

    setIsGenerating(true);

    try {
      // Mock data generation - in real implementation, this would call an API
      const mockData: SUAData = {
        period,
        companyId: "COMP001",
        employeeCount: 147,
        totalSalary: 2850000, // Mock total salary in MXN
      };

      setGeneratedData(mockData);

      if (onGenerate) {
        onGenerate(mockData);
      }

      toast.success("SUA file generated successfully");
    } catch (error) {
      toast.error("Failed to generate SUA file");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedData) return;

    // Mock file download - in real implementation, this would download the actual file
    toast.success("SUA file downloaded");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          SUA File Generator
        </CardTitle>
        <CardDescription>
          Generate Salary Update Files for IMSS monthly reporting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            SUA files must be submitted to IMSS by the 17th of each month for the previous month's salaries.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="period">Reporting Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026-04">April 2026</SelectItem>
                <SelectItem value="2026-03">March 2026</SelectItem>
                <SelectItem value="2026-02">February 2026</SelectItem>
                <SelectItem value="2026-01">January 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">File Format</Label>
            <Select defaultValue="excel">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="txt">Text (.txt)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {generatedData && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">File Generated Successfully</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium">Period</p>
                  <p className="text-sm text-muted-foreground">{generatedData.period}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Employees</p>
                  <p className="text-sm text-muted-foreground">{generatedData.employeeCount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Salary</p>
                  <p className="text-sm text-muted-foreground">
                    ${generatedData.totalSalary.toLocaleString()} MXN
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant="default">Ready</Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDownload} size="sm">
                  <FileDown className="h-4 w-4 mr-2" />
                  Download File
                </Button>
                <Button variant="outline" size="sm">
                  Submit to IMSS
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !period}
          >
            {isGenerating ? "Generating..." : "Generate SUA File"}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">What this includes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Employee identification (NSS, CURP, RFC)</li>
            <li>Salary information (daily, weekly, monthly rates)</li>
            <li>Work schedule details (hours, days)</li>
            <li>Contribution calculations (employer/employee portions)</li>
            <li>IMSS branch and company information</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}