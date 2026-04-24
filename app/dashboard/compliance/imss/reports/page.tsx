import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { SUAFileGenerator } from "@/components/compliance/sua-file-generator";

export default function IMSSReportsPage() {
  // Mock data - in real implementation, this would come from API
  const recentReports = [
    {
      id: "1",
      type: "SUA",
      period: "April 2026",
      generatedAt: "2026-04-30",
      status: "SUBMITTED",
      employeeCount: 147,
    },
    {
      id: "2",
      type: "IDSE",
      period: "April 2026",
      generatedAt: "2026-04-15",
      status: "SUBMITTED",
      employeeCount: 3,
    },
    {
      id: "3",
      type: "SIPARE",
      period: "March 2026",
      generatedAt: "2026-03-31",
      status: "SUBMITTED",
      employeeCount: 145,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">IMSS Reports & Files</h1>
        <p className="text-muted-foreground">
          Generate and manage IMSS compliance files and reports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">SUA Files</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Generated this year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">IDSE Files</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Employee movements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contribution Reports</CardTitle>
            <FileDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1.2M</div>
            <p className="text-xs text-muted-foreground">
              Total contributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">
              Files submitted on time
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Files</TabsTrigger>
          <TabsTrigger value="history">File History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <SUAFileGenerator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">IDSE Files</CardTitle>
                <CardDescription>
                  Employee Movement Files - Hires, terminations, changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Report employee movements including new hires, terminations,
                  and significant employment changes.
                </p>
                <Button disabled className="w-full">
                  <FileDown className="h-4 w-4 mr-2" />
                  Generate IDSE File
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">IDSE Files</CardTitle>
                <CardDescription>
                  Employee Movement Files - Hires, terminations, changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Report employee movements including new hires, terminations,
                  and significant employment changes.
                </p>
                <Button disabled className="w-full">
                  <FileDown className="h-4 w-4 mr-2" />
                  Generate IDSE File
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SIPARE Files</CardTitle>
                <CardDescription>
                  Contribution Files - Payment calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate detailed contribution calculations for IMSS payments,
                  including employer and employee portions.
                </p>
                <Button disabled className="w-full">
                  <FileDown className="h-4 w-4 mr-2" />
                  Generate SIPARE File
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bulk Operations</CardTitle>
              <CardDescription>
                Generate multiple files or reports at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button disabled variant="outline">
                  Generate All Monthly Files
                </Button>
                <Button disabled variant="outline">
                  Generate Quarterly Summary
                </Button>
                <Button disabled variant="outline">
                  Export Compliance Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Files History</CardTitle>
              <CardDescription>
                View and download previously generated IMSS files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Badge variant="outline">{report.type}</Badge>
                      </TableCell>
                      <TableCell>{report.period}</TableCell>
                      <TableCell>{report.generatedAt}</TableCell>
                      <TableCell>{report.employeeCount}</TableCell>
                      <TableCell>
                        <Badge variant={report.status === 'SUBMITTED' ? 'default' : 'secondary'}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" disabled>
                          <FileDown className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Templates</CardTitle>
              <CardDescription>
                Download blank templates for manual file creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">SUA Template</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Excel template for monthly salary updates
                    </p>
                    <Button size="sm" variant="outline" disabled>Download</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">IDSE Template</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Template for employee movement reporting
                    </p>
                    <Button size="sm" variant="outline" disabled>Download</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">SIPARE Template</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Template for contribution calculations
                    </p>
                    <Button size="sm" variant="outline" disabled>Download</Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Validation Rules</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Document with validation rules and requirements
                    </p>
                    <Button size="sm" variant="outline" disabled>Download</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}