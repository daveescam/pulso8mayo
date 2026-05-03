"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Loader2, Package, PackagePlus, ArrowRight, AlertTriangle, Building2, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useBranch } from "@/lib/branch-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = [
  { value: "Materia Prima", label: "Materia Prima" },
  { value: "Producto Terminado", label: "Producto Terminado" },
  { value: "Insumo", label: "Insumo" },
  { value: "Embalaje", label: "Embalaje" },
  { value: "Otro", label: "Otro" },
];

const UNITS = [
  { value: "KG", label: "KG" },
  { value: "L", label: "L" },
  { value: "PIEZA", label: "PIEZA" },
  { value: "CAJA", label: "CAJA" },
  { value: "BOLSA", label: "BOLSA" },
  { value: "OTRO", label: "OTRO" },
];

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formUnit, setFormUnit] = useState("KG");
  const [formMinLevel, setFormMinLevel] = useState("");
  const { selectedBranchId, selectedBranch } = useBranch();

  useEffect(() => {
    fetchProducts();
  }, [selectedBranchId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = selectedBranchId
        ? `/api/inventory/products?branchId=${selectedBranchId}`
        : "/api/inventory/products";

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormSku("");
    setFormCategory("");
    setFormUnit("KG");
    setFormMinLevel("");
  };

  const handleCreateProduct = async () => {
    if (!formName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    try {
      setSubmitting(true);
      const body: Record<string, any> = {
        name: formName.trim(),
        unit: formUnit,
      };
      if (formSku.trim()) body.sku = formSku.trim();
      if (formCategory) body.category = formCategory;
      if (formMinLevel && Number(formMinLevel) > 0) body.minLevel = Number(formMinLevel);

      const res = await fetch("/api/inventory/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Producto creado");
        setDialogOpen(false);
        resetForm();
        fetchProducts();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al crear producto");
      }
    } catch (error) {
      toast.error("Error al crear producto");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      product.name?.toLowerCase().includes(q) ||
      product.sku?.toLowerCase().includes(q) ||
      product.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">Gestión de Inventario</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona productos, niveles de stock y recepciones
          </p>
          {selectedBranch && (
            <Badge variant="outline" className="mt-2 gap-1">
              <Building2 className="h-3 w-3" />
              {selectedBranch.name}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/inventory/receiving">
            <Button variant="outline" className="gap-2">
              <PackagePlus className="h-4 w-4" />
              Recepción
            </Button>
          </Link>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Agregar Producto
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/inventory/receiving">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recepción de Inventario
              </CardTitle>
              <PackagePlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Nueva Recepción</div>
              <p className="text-xs text-muted-foreground">
                Registrar stock entrante de proveedores
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Productos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              Artículos registrados
            </p>
          </CardContent>
        </Card>

        <Link href="/dashboard/inventory/suppliers">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Proveedores
              </CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Gestionar</div>
              <p className="text-xs text-muted-foreground">
                Ver y gestionar proveedores
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/inventory/waste">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">
                Registrar Merma
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">Merma</div>
              <p className="text-xs text-muted-foreground">
                Registrar caducados, dañados o problemas de calidad
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/inventory/stock-count">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Conteo de Stock
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">Conteo</div>
              <p className="text-xs text-muted-foreground">
                Iniciar conteo físico de inventario
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar productos..."
            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          <CardDescription>
            Lista de todos los artículos del inventario
            {selectedBranch && ` para ${selectedBranch.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Unidad</TableHead>
                  {selectedBranchId && <TableHead>Stock Actual</TableHead>}
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={selectedBranchId ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      No se encontraron productos. Agrega uno para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {product.name}
                          {product.isLowStock && selectedBranchId && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      {selectedBranchId && (
                        <TableCell>
                          <span className={product.isLowStock ? "text-amber-600 font-medium" : ""}>
                            {product.currentStock || 0}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Link href={`/dashboard/inventory/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            Ver
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agregar Producto</DialogTitle>
            <DialogDescription>
              Ingresa los datos del nuevo producto
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product-name">Nombre *</Label>
              <Input
                id="product-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nombre del producto"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-sku">SKU</Label>
              <Input
                id="product-sku"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                placeholder="Código SKU (opcional)"
              />
            </div>
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Unidad</Label>
              <Select value={formUnit} onValueChange={setFormUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-min-level">Nivel Mínimo</Label>
              <Input
                id="product-min-level"
                type="number"
                min="0"
                value={formMinLevel}
                onChange={(e) => setFormMinLevel(e.target.value)}
                placeholder="Stock mínimo (opcional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProduct} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
