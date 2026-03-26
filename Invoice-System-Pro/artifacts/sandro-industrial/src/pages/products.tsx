import { useState } from "react";
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, Product, CreateProductRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search, Plus, Edit2, Trash2, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/utils";

const productSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  code: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  unitPrice: z.coerce.number().min(0, "Debe ser un precio válido"),
  unit: z.string().optional(),
});

export default function Products() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const { data, isLoading } = useListProducts({ search, page, limit: 10 });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", code: "", description: "", category: "", unitPrice: 0, unit: "UND" }
  });

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    form.reset({
      name: product.name,
      code: product.code || "",
      description: product.description || "",
      category: product.category || "",
      unitPrice: product.unitPrice,
      unit: product.unit || "UND"
    });
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    form.reset({ name: "", code: "", description: "", category: "", unitPrice: 0, unit: "UND" });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof productSchema>) => {
    const payload = { ...values, active: true } as CreateProductRequest;
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({ title: "Producto actualizado" });
            setIsDialogOpen(false);
          }
        }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({ title: "Producto creado" });
            setIsDialogOpen(false);
          }
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de eliminar este producto?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            toast({ title: "Producto eliminado" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Catálogo de Productos</h1>
          <p className="text-muted-foreground mt-1">Gestione sus productos y servicios.</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md font-bold h-11 px-6">
          <Plus className="mr-2" size={18} /> Nuevo Producto
        </Button>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Buscar productos..." 
                className="pl-10 h-11 rounded-xl bg-background border-border/80"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-sidebar">
                  <TableRow className="hover:bg-sidebar">
                    <TableHead className="text-white font-semibold">Código</TableHead>
                    <TableHead className="text-white font-semibold">Descripción</TableHead>
                    <TableHead className="text-white font-semibold">Categoría</TableHead>
                    <TableHead className="text-white font-semibold text-right">Precio U.</TableHead>
                    <TableHead className="text-white font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">Cargando...</TableCell>
                    </TableRow>
                  ) : !data || data.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center p-12">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Package size={48} className="mb-4 opacity-20" />
                          <p className="text-lg font-medium">No se encontraron productos</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.data.map((product) => (
                      <TableRow key={product.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-sm">{product.code || '-'}</TableCell>
                        <TableCell>
                          <div className="font-bold text-foreground">{product.name}</div>
                          {product.description && <div className="text-xs text-muted-foreground truncate max-w-[250px]">{product.description}</div>}
                        </TableCell>
                        <TableCell><span className="bg-muted px-2 py-1 rounded text-xs font-semibold">{product.category || 'General'}</span></TableCell>
                        <TableCell className="text-right font-bold text-foreground">{formatMoney(product.unitPrice)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => openEdit(product)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Edit2 size={14} />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleDelete(product.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">Mostrando página {data.page} de {data.totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant="outline" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">{editingId ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Producto *</FormLabel>
                  <FormControl><Input {...field} placeholder="Ej. Puerta de Aluminio..." className="h-11" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código SKU</FormLabel>
                    <FormControl><Input {...field} placeholder="PRD-001" className="h-11" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <FormControl><Input {...field} placeholder="Puertas" className="h-11" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unitPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Unitario (RD$) *</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} className="h-11" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de Medida</FormLabel>
                    <FormControl><Input {...field} placeholder="UND, Pie2, Metro..." className="h-11" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción detallada (Opcional)</FormLabel>
                  <FormControl><Input {...field} className="h-11" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="mt-6 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11">Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="h-11 px-8 font-bold">
                  {editingId ? "Guardar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
