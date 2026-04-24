"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";

interface RFCValidationResult {
  rfc: string;
  employeeName: string;
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

export function SATRFCValidator() {
  const [rfc, setRfc] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<RFCValidationResult[]>([]);

  const validateRFC = (rfc: string): boolean => {
    // Basic RFC validation regex for Mexican RFC
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}(?:[A-Z\d]{3})?$/;
    return rfcRegex.test(rfc.toUpperCase());
  };

  const handleValidateSingle = async () => {
    if (!rfc.trim()) {
      toast.error("Please enter an RFC");
      return;
    }

    setIsValidating(true);

    try {
      // Mock validation - in real implementation, this would call SAT API
      const isValid = validateRFC(rfc);
      const result: RFCValidationResult = {
        rfc: rfc.toUpperCase(),
        employeeName: "Mock Employee", // Would come from database lookup
        isValid,
        error: isValid ? undefined : "Invalid RFC format",
        suggestions: isValid ? undefined : ["Check for typos", "Verify with official documents"],
      };

      setResults(prev => [result, ...prev]);
      toast.success(isValid ? "RFC is valid" : "RFC validation failed");
    } catch (error) {
      toast.error("Failed to validate RFC");
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidateAll = async () => {
    setIsValidating(true);

    try {
      // Mock bulk validation - in real implementation, this would validate all employee RFCs
      const mockResults: RFCValidationResult[] = [
        { rfc: "XAXX010101000", employeeName: "Juan Pérez", isValid: true },
        { rfc: "INVALID123", employeeName: "María López", isValid: false, error: "Invalid format" },
        { rfc: "BBBB020202BBB", employeeName: "Carlos Ruiz", isValid: true },
      ];

      setResults(mockResults);
      toast.success("Bulk RFC validation completed");
    } catch (error) {
      toast.error("Failed to validate RFCs");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          RFC Validator
        </CardTitle>
        <CardDescription>
          Validate Mexican tax identification numbers (RFC) against SAT format requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            RFC validation ensures compliance with SAT requirements. Invalid RFCs may cause issues with tax filings and government reports.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rfc">RFC to Validate</Label>
            <div className="flex gap-2">
              <Input
                id="rfc"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                placeholder="XAXX010101000"
                maxLength={13}
              />
              <Button
                onClick={handleValidateSingle}
                disabled={isValidating}
              >
                {isValidating ? "Validating..." : "Validate"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>RFC Format Rules</Label>
            <div className="text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>3-4 letters, 6 digits, optional 3 characters</li>
                <li>First letter indicates type (XA for foreigners)</li>
                <li>Date of birth encoded in digits</li>
                <li>Homonimia code at the end</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleValidateAll}
            disabled={isValidating}
            variant="outline"
          >
            Validate All Employee RFCs
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Validation Results</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFC</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{result.rfc}</TableCell>
                    <TableCell>{result.employeeName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {result.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={result.isValid ? "default" : "destructive"}>
                          {result.isValid ? "Valid" : "Invalid"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {result.error && (
                        <span className="text-red-600 text-sm">{result.error}</span>
                      )}
                      {result.suggestions && (
                        <div className="text-sm text-muted-foreground">
                          Suggestions: {result.suggestions.join(", ")}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">RFC Structure:</p>
          <div className="font-mono bg-muted p-2 rounded text-xs">
            [3-4 letters][6 digits][3 chars optional]<br />
            Example: XAXX010101000<br />
            XA = Foreigner, XX = Name initials, 010101 = Birth date (Jan 1, 2001), 000 = Homonimia
          </div>
        </div>
      </CardContent>
    </Card>
  );
}