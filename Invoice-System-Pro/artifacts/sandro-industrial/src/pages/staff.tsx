import { useState } from "react";
import { useListStaff, useCreateStaff, useUpdateStaff, useDeleteStaff, StaffMember, CreateStaffRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, UserCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const staffSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  role: z.enum(["measurer", "quoter", "both"]),
  active: z.boolean().default(true),
});

export default function Staff() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const { data: staffList, isLoading } = useListStaff();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const deleteMutation = useDeleteStaff();

  const form = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: "", role: "both", active: true }
  });

  const openEdit = (staff: StaffMember) => {
    setEditingId(staff.id);
    form.reset({
      name: staff.name,
      role: staff.role,
      active: staff.active ?? true
    });
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    form.reset({ name: "", role: "both", active: true });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof staffSchema>) => {
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: values as CreateStaffRequest },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
            toast({ title: "Personal actualizado" });
            setIsDialogOpen(false);
          }
        }
      );
    } else {
      createMutation.mutate(
        { data: values as CreateStaffRequest },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
            toast({ title: "Personal creado" });
            setIsDialogOpen(false);
          }
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de eliminar este registro?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
            toast({ title: "Personal eliminado" });
          }
        }
      );
    }
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'measurer': return 'Medidor';
      case 'quoter': return 'Cotizador';
      case 'both': return 'Medidor y Cotizador';
      default: return role;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Gestión de Personal</h1>
          <p className="text-muted-foreground mt-1">Personal que realiza mediciones y cotizaciones.</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md font-bold h-11 px-6">
          <Plus className="mr-2" size={18} /> Nuevo Registro
        </Button>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-xl">
            <Table>
              <TableHeader className="bg-sidebar">
                <TableRow className="hover:bg-sidebar">
                  <TableHead className="text-white font-semibold">Nombre</TableHead>
                  <TableHead className="text-white font-semibold">Rol Asignado</TableHead>
                  <TableHead className="text-white font-semibold">Estado</TableHead>
                  <TableHead className="text-white font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center p-8 text-muted-foreground">Cargando...</TableCell>
                  </TableRow>
                ) : !staffList || staffList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center p-12">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <UserCheck size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">No hay personal registrado</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  staffList.map((staff) => (
                    <TableRow key={staff.id} className="hover:bg-muted/30">
                      <TableCell className="font-bold text-foreground">{staff.name}</TableCell>
                      <TableCell><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold uppercase">{getRoleLabel(staff.role)}</span></TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${staff.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {staff.active !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => openEdit(staff)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <Edit2 size={14} />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(staff.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
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
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">{editingId ? "Editar Personal" : "Nuevo Registro"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo *</FormLabel>
                  <FormControl><Input {...field} placeholder="Ej. Juan Pérez" className="h-11" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol en la Empresa *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Seleccione el rol" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="measurer">Medidor</SelectItem>
                      <SelectItem value="quoter">Cotizador</SelectItem>
                      <SelectItem value="both">Medidor y Cotizador</SelectItem>
                    </SelectContent>
                  </Select>
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
