import { useState } from "react";
import { useListClients, useCreateClient, useUpdateClient, useDeleteClient, Client, CreateClientRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search, Plus, Edit2, Trash2, Users, Smartphone, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const clientSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  code: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
});

export default function Clients() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isLoading } = useListClients({ search, page, limit: 10 });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", code: "", address: "", city: "", phone: "", mobile: "" }
  });

  const openEdit = (client: Client) => {
    setEditingId(client.id);
    form.reset({
      name: client.name,
      code: client.code || "",
      address: client.address || "",
      city: client.city || "",
      phone: client.phone || "",
      mobile: client.mobile || ""
    });
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    form.reset({ name: "", code: "", address: "", city: "", phone: "", mobile: "" });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof clientSchema>) => {
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: values as CreateClientRequest },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
            toast({ title: "Cliente actualizado" });
            setIsDialogOpen(false);
          }
        }
      );
    } else {
      createMutation.mutate(
        { data: values as CreateClientRequest },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
            toast({ title: "Cliente creado" });
            setIsDialogOpen(false);
          }
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de eliminar este cliente?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
            toast({ title: "Cliente eliminado" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Directorio de Clientes</h1>
          <p className="text-muted-foreground mt-1">Gestione la información de sus clientes.</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md font-bold h-11 px-6">
          <Plus className="mr-2" size={18} /> Nuevo Cliente
        </Button>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar clientes por nombre, teléfono..."
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
                    <TableHead className="text-white font-semibold">Nombre</TableHead>
                    <TableHead className="text-white font-semibold">Contacto</TableHead>
                    <TableHead className="text-white font-semibold">Dirección</TableHead>
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
                          <Users size={48} className="mb-4 opacity-20" />
                          <p className="text-lg font-medium">No se encontraron clientes</p>
                          <p className="text-sm mt-1">Pruebe con otra búsqueda o agregue un cliente nuevo.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.data.map((client) => (
                      <TableRow key={client.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-sm">{client.code || '-'}</TableCell>
                        <TableCell className="font-bold text-foreground">{client.name}</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {client.mobile && <div className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-muted-foreground" /> {client.mobile}</div>}
                            {client.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" /> {client.phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-[200px]" title={client.address}>
                          {client.address || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => openEdit(client)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                              <Edit2 size={14} />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleDelete(client.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
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
        <DialogContent className="sm:max-w-[600px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">{editingId ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nombre o Razón Social *</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej. Constructora SRL" className="h-11" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código / RNC</FormLabel>
                    <FormControl><Input {...field} placeholder="1311..." className="h-11" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl><Input {...field} placeholder="Santo Domingo" className="h-11" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección Física</FormLabel>
                    <FormControl><Input {...field} placeholder="C/ Principal #123..." className="h-11" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono Residencial/Oficina</FormLabel>
                    <FormControl><Input {...field} placeholder="809-000-0000" className="h-11" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mobile" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono Celular</FormLabel>
                    <FormControl><Input {...field} placeholder="829-000-0000" className="h-11" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter className="mt-6 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11">Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="h-11 px-8 font-bold">
                  {editingId ? "Guardar Cambios" : "Crear Cliente"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
