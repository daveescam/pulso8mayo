"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Filter,
    Save,
    ChevronLeft,
    ChevronRight,
    Star,
    Trash2,
    Download,
    Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Employee {
    id: string;
    userId: string;
    employeeNumber: string | null;
    name: string;
    email: string;
    image: string | null;
    department: string | null;
    position: string | null;
    employeeStatus: string;
    hireDate: Date | null;
    branchId: string | null;
    city: string | null;
    state: string | null;
    profilePhotoUrl: string | null;
}

interface SavedSearch {
    id: string;
    name: string;
    description: string | null;
    searchCriteria: any;
    usageCount: number;
    lastUsedAt: Date | null;
}

interface SearchResult {
    employees: Employee[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    filters: {
        departments: string[];
    };
}

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    ONBOARDING: 'bg-blue-100 text-blue-800',
    ON_LEAVE: 'bg-yellow-100 text-yellow-800',
    TERMINATED: 'bg-red-100 text-red-800',
    RESIGNED: 'bg-gray-100 text-gray-800',
};

export default function AdvancedEmployeeSearch() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filters, setFilters] = React.useState({
        department: 'all',
        status: 'all',
        branchId: 'all',
        city: '',
        state: '',
        hireDateFrom: '',
        hireDateTo: '',
    });
    const [sortBy, setSortBy] = React.useState('name');
    const [sortOrder, setSortOrder] = React.useState('asc');
    const [page, setPage] = React.useState(1);
    const [limit] = React.useState(20);
    const [result, setResult] = React.useState<SearchResult | null>(null);
    const [savedSearches, setSavedSearches] = React.useState<SavedSearch[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [showFilters, setShowFilters] = React.useState(false);
    const [showSavedSearches, setShowSavedSearches] = React.useState(false);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                companyId: 'temp-company-id', // Get from session
                search: searchTerm,
                page: page.toString(),
                limit: limit.toString(),
                sortBy,
                sortOrder,
                ...Object.fromEntries(
                    Object.entries(filters).map(([key, value]) => [key, value.toString()])
                ),
            });

            const response = await fetch(`/api/employees/search?${params}`);
            if (response.ok) {
                const data = await response.json();
                setResult(data);
            } else {
                throw new Error('Search failed');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to search employees",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSearch = async () => {
        if (!searchTerm && Object.values(filters).every(v => v === 'all' || v === '')) {
            toast({
                title: "Error",
                description: "Please enter search criteria first",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await fetch('/api/employees/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'temp-user-id', // Get from session
                    companyId: 'temp-company-id',
                    name: searchTerm || 'Filtered Search',
                    description: `Search with filters: ${JSON.stringify(filters)}`,
                    searchCriteria: { searchTerm, filters, sortBy, sortOrder },
                    entityType: 'EMPLOYEE',
                }),
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Search saved successfully",
                });
                // Refresh saved searches
            } else {
                throw new Error('Failed to save search');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save search",
                variant: "destructive",
            });
        }
    };

    const handleExport = (format: 'csv' | 'json') => {
        if (!result || result.employees.length === 0) {
            toast({
                title: "Error",
                description: "No results to export",
                variant: "destructive",
            });
            return;
        }

        const data = result.employees.map(emp => ({
            employeeNumber: emp.employeeNumber,
            name: emp.name,
            email: emp.email,
            department: emp.department,
            position: emp.position,
            status: emp.employeeStatus,
            city: emp.city,
            state: emp.state,
            hireDate: emp.hireDate,
        }));

        const content = format === 'csv'
            ? convertToCSV(data)
            : JSON.stringify(data, null, 2);

        const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `employees-${Date.now()}.${format === 'csv' ? 'csv' : 'json'}`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
            title: "Export Complete",
            description: `${result.employees.length} employees exported as ${format.toUpperCase()}`,
        });
    };

    const convertToCSV = (data: any[]) => {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const rows = data.map(row =>
            headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) return '';
                if (value instanceof Date) return value.toISOString();
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        );
        return [headers.join(','), ...rows].join('\n');
    };

    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm || Object.values(filters).some(v => v !== 'all' && v !== '')) {
                handleSearch();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, filters, sortBy, sortOrder, page]);

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Employee Search</h1>
                <p className="text-muted-foreground mt-1">
                    Search and filter employees across the organization
                </p>
            </div>

            {/* Search Bar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-2 items-center">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, employee number, department, position, or email..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleSaveSearch}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                        </Button>
                        {result && result.employees.length > 0 && (
                            <>
                                <Button variant="outline" onClick={() => handleExport('csv')}>
                                    <Download className="h-4 w-4 mr-2" />
                                    CSV
                                </Button>
                                <Button variant="outline" onClick={() => handleExport('json')}>
                                    <Download className="h-4 w-4 mr-2" />
                                    JSON
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            {showFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle>Advanced Filters</CardTitle>
                        <CardDescription>Refine your search with additional filters</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Select
                                    value={filters.department}
                                    onValueChange={(value) => {
                                        setFilters(prev => ({ ...prev, department: value }));
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {result?.filters.departments.map(dept => (
                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={filters.status}
                                    onValueChange={(value) => {
                                        setFilters(prev => ({ ...prev, status: value }));
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                                        <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                                        <SelectItem value="TERMINATED">Terminated</SelectItem>
                                        <SelectItem value="RESIGNED">Resigned</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>City</Label>
                                <Input
                                    placeholder="Filter by city"
                                    value={filters.city}
                                    onChange={(e) => {
                                        setFilters(prev => ({ ...prev, city: e.target.value }));
                                        setPage(1);
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>State</Label>
                                <Input
                                    placeholder="Filter by state"
                                    value={filters.state}
                                    onChange={(e) => {
                                        setFilters(prev => ({ ...prev, state: e.target.value }));
                                        setPage(1);
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Hire Date From</Label>
                                <Input
                                    type="date"
                                    value={filters.hireDateFrom}
                                    onChange={(e) => {
                                        setFilters(prev => ({ ...prev, hireDateFrom: e.target.value }));
                                        setPage(1);
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Hire Date To</Label>
                                <Input
                                    type="date"
                                    value={filters.hireDateTo}
                                    onChange={(e) => {
                                        setFilters(prev => ({ ...prev, hireDateTo: e.target.value }));
                                        setPage(1);
                                    }}
                                />
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Label>Sort By</Label>
                                <div className="flex gap-2">
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="name">Name</SelectItem>
                                            <SelectItem value="employeeNumber">Employee Number</SelectItem>
                                            <SelectItem value="department">Department</SelectItem>
                                            <SelectItem value="hireDate">Hire Date</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={sortOrder} onValueChange={setSortOrder}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="asc">Ascending</SelectItem>
                                            <SelectItem value="desc">Descending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    setFilters({
                                        department: 'all',
                                        status: 'all',
                                        branchId: 'all',
                                        city: '',
                                        state: '',
                                        hireDateFrom: '',
                                        hireDateTo: '',
                                    });
                                    setPage(1);
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            {result && (
                <>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="text-sm text-muted-foreground">
                                {result.pagination.total} employees found
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Page {result.pagination.page} of {result.pagination.totalPages}
                            </span>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Employee #</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Hire Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {result.employees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={employee.profilePhotoUrl || employee.image || undefined} />
                                                        <AvatarFallback>
                                                            {employee.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{employee.name}</div>
                                                        <div className="text-sm text-muted-foreground">{employee.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {employee.employeeNumber || '-'}
                                            </TableCell>
                                            <TableCell>{employee.department || '-'}</TableCell>
                                            <TableCell>{employee.position || '-'}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={STATUS_COLORS[employee.employeeStatus] || ''}
                                                >
                                                    {employee.employeeStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {employee.city && employee.state
                                                    ? `${employee.city}, ${employee.state}`
                                                    : employee.city || employee.state || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {employee.hireDate
                                                    ? new Date(employee.hireDate).toLocaleDateString('es-MX')
                                                    : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    {result.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!result.pagination.hasPrev}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {result.pagination.page} of {result.pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!result.pagination.hasNext}
                                onClick={() => setPage(p => Math.min(result.pagination.totalPages, p + 1))}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* No Results */}
            {result && result.employees.length === 0 && (
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center text-center">
                            <Search className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No employees found</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Try adjusting your search criteria or filters
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
