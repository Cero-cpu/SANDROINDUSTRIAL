import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateInvoice,
  useUpdateInvoice,
  useGetInvoice,
  useListClients,
  useListProducts,
  useListStaff,
  Client,
  Product,
  CreateInvoiceRequest
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Search, Save, X, Plus, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const invoiceItemSchema = z.object({
  productId: z.coerce.number().optional(),
  description: z.string().min(1, "Requerido"),
  quantity: z.coerce.number().min(0.01, "Mínimo 0.01"),
  unitPrice: z.coerce.number().min(0, "Precio inválido"),
  total: z.coerce.number().min(0)
});

const invoiceSchema = z.object({
  clientId: z.coerce.number({ required_error: "Seleccione un cliente" }),
  measuredById: z.coerce.number().optional(),
  quotedById: z.coerce.number().optional(),
  budgetDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  paymentMethod: z.enum(["50%", "100%", "contra_entrega"]).default("50%"),
  downPayment: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  status: z.enum(["pending", "paid", "cancelled"]).default("pending"),
  items: z.array(invoiceItemSchema).min(1, "Debe tener al menos un ítem")
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function InvoiceForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const { data: clientsData } = useListClients({ search: clientSearch, limit: 5 });
  const { data: productsData } = useListProducts({ search: productSearch, limit: 5 });
  const { data: staffData } = useListStaff();

  const { data: existingInvoice, isLoading: loadingExisting } = useGetInvoice(isEditing ? parseInt(id!) : 0, {
    query: { enabled: isEditing }
  });

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: 0,
      paymentMethod: "50%",
      downPayment: 0,
      status: "pending",
      budgetDate: new Date().toISOString().split('T')[0],
      items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  useEffect(() => {
    if (isEditing && existingInvoice) {
      form.reset({
        clientId: existingInvoice.clientId || 0,
        measuredById: existingInvoice.measuredById || undefined,
        quotedById: existingInvoice.quotedById || undefined,
        budgetDate: existingInvoice.budgetDate || new Date().toISOString().split('T')[0],
        deliveryDate: existingInvoice.deliveryDate || "",
        paymentMethod: existingInvoice.paymentMethod || "50%",
        downPayment: existingInvoice.downPayment || 0,
        notes: existingInvoice.notes || "",
        status: existingInvoice.status,
        items: existingInvoice.items?.map(i => ({
          productId: i.productId,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total
        })) || [{ description: "", quantity: 1, unitPrice: 0, total: 0 }]
      });
      if (existingInvoice.client) {
        setSelectedClient(existingInvoice.client);
      }
    }
  }, [existingInvoice, isEditing, form]);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    form.setValue("clientId", client.id);
    setClientSearch("");
  };

  const selectProduct = (product: Product, index: number) => {
    form.setValue(`items.${index}.productId`, product.id);
    form.setValue(`items.${index}.description`, product.name + (product.description ? ` - ${product.description}` : ''));
    form.setValue(`items.${index}.unitPrice`, product.unitPrice);

    // Calculate total
    const qty = form.getValues(`items.${index}.quantity`) || 1;
    form.setValue(`items.${index}.total`, qty * product.unitPrice);

    setProductSearch("");
    setActiveItemIndex(null);
  };

  const calculateRowTotal = (index: number) => {
    const qty = form.getValues(`items.${index}.quantity`) || 0;
    const price = form.getValues(`items.${index}.unitPrice`) || 0;
    form.setValue(`items.${index}.total`, qty * price);
  };

  const itemsWatch = form.watch("items");
  const downPaymentWatch = form.watch("downPayment");

  const { subtotal, total, remaining } = useMemo(() => {
    const sum = itemsWatch.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
    return {
      subtotal: sum,
      total: sum,
      remaining: Math.max(0, sum - (Number(downPaymentWatch) || 0))
    };
  }, [itemsWatch, downPaymentWatch]);

  const onSubmit = (values: InvoiceFormValues) => {
    if (values.clientId === 0) {
      toast({ variant: "destructive", title: "Error", description: "Debe seleccionar un cliente." });
      return;
    }

    const payload = values as unknown as CreateInvoiceRequest;

    if (isEditing) {
      updateMutation.mutate(
        { id: parseInt(id!), data: payload },
        {
          onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
            toast({ title: "Éxito", description: "Factura actualizada correctamente" });
            setLocation(`/facturas/${res.id}`);
          },
          onError: () => toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la factura" })
        }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
            toast({ title: "Éxito", description: "Factura creada correctamente" });
            setLocation(`/facturas/${res.id}`);
          },
          onError: () => toast({ variant: "destructive", title: "Error", description: "No se pudo crear la factura" })
        }
      );
    }
  };

  if (isEditing && loadingExisting) return <div className="p-12 text-center text-muted-foreground animate-pulse">Cargando factura...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-display text-foreground">
          {isEditing ? `Editar Factura ${existingInvoice?.invoiceNumber || ''}` : "Crear Nueva Factura"}
        </h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setLocation("/facturas")} className="h-11">
            <X className="mr-2" size={16} /> Cancelar
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* CLIENT SECTION */}
            <Card className="lg:col-span-2 border-border/60 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-display font-bold mb-4 border-b pb-2">Datos del Cliente</h3>

                <div className="mb-4 relative">
                  <Label>Buscar y Seleccionar Cliente</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      placeholder="Escriba el nombre del cliente..."
                      className="pl-10 h-11"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                    />
                  </div>
                  {clientSearch && clientsData && clientsData.data.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-border shadow-xl rounded-md max-h-60 overflow-y-auto">
                      {clientsData.data.map(client => (
                        <div
                          key={client.id}
                          className="px-4 py-3 hover:bg-muted/50 cursor-pointer border-b last:border-0"
                          onClick={() => selectClient(client)}
                        >
                          <div className="font-bold">{client.name}</div>
                          <div className="text-xs text-muted-foreground">{client.phone} | {client.address}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedClient && (
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold text-muted-foreground">Nombre:</span> <span className="font-bold">{selectedClient.name}</span></div>
                    <div><span className="font-semibold text-muted-foreground">Código/RNC:</span> {selectedClient.code || '-'}</div>
                    <div className="md:col-span-2"><span className="font-semibold text-muted-foreground">Dirección:</span> {selectedClient.address || '-'}</div>
                    <div><span className="font-semibold text-muted-foreground">Teléfono:</span> {selectedClient.phone || '-'}</div>
                    <div><span className="font-semibold text-muted-foreground">Celular:</span> {selectedClient.mobile || '-'}</div>
                  </div>
                )}
                {!selectedClient && !isEditing && (
                  <div className="p-4 text-center text-amber-600 bg-amber-50 rounded-xl text-sm border border-amber-200">
                    Debe seleccionar un cliente para la factura.
                  </div>
                )}
                <input type="hidden" {...form.register("clientId")} />
                {form.formState.errors.clientId && (
                  <p className="text-destructive text-sm mt-1">{form.formState.errors.clientId.message}</p>
                )}
              </CardContent>
            </Card>

            {/* DETAILS SECTION */}
            <Card className="border-border/60 shadow-md">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-display font-bold mb-4 border-b pb-2">Detalles de Emisión</h3>

                <FormField control={form.control} name="budgetDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Emisión / Cotización</FormLabel>
                    <FormControl><Input type="date" {...field} className="h-10" /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Entrega <span className="text-xs font-normal text-muted-foreground">(Se destacará en amarillo)</span></FormLabel>
                    <FormControl><Input type="text" placeholder="Ej. 15 de Noviembre" {...field} className="h-10 border-accent bg-accent/5 focus-visible:ring-accent" /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem className="pt-2">
                    <FormLabel>Estado del Documento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Estado" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente / Cotización</SelectItem>
                        <SelectItem value="paid">Pagada / Completada</SelectItem>
                        <SelectItem value="cancelled">Anulada</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </div>

          {/* PRODUCTS TABLE */}
          <Card className="border-border/60 shadow-md">
            <CardContent className="p-0">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-display font-bold">Detalle de Productos</h3>
                <Button type="button" onClick={() => append({ description: "", quantity: 1, unitPrice: 0, total: 0 })} variant="outline" size="sm" className="h-9">
                  <Plus size={16} className="mr-1" /> Añadir Fila
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-sidebar">
                    <TableRow className="hover:bg-sidebar">
                      <TableHead className="text-white font-semibold w-12 text-center">N°</TableHead>
                      <TableHead className="text-white font-semibold">Descripción del Producto</TableHead>
                      <TableHead className="text-white font-semibold w-32 text-right">Cantidad</TableHead>
                      <TableHead className="text-white font-semibold w-40 text-right">Precio Un.</TableHead>
                      <TableHead className="text-white font-semibold w-40 text-right">Total RD$</TableHead>
                      <TableHead className="text-white font-semibold w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((item, index) => (
                      <TableRow key={item.id} className="group">
                        <TableCell className="text-center font-mono text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="relative p-2">
                          <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-10 bg-transparent border-transparent group-hover:border-border/50 focus:border-ring focus:bg-white"
                                  placeholder="Escriba descripción o busque producto..."
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value.length > 2) {
                                      setProductSearch(e.target.value);
                                      setActiveItemIndex(index);
                                    } else {
                                      setActiveItemIndex(null);
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )} />
                          {activeItemIndex === index && productSearch && productsData && productsData.data.length > 0 && (
                            <div className="absolute z-50 w-[90%] left-4 top-12 bg-white border border-border shadow-xl rounded-md max-h-60 overflow-y-auto">
                              {productsData.data.map(product => (
                                <div
                                  key={product.id}
                                  className="px-4 py-2 hover:bg-muted/50 cursor-pointer border-b text-sm"
                                  onClick={() => selectProduct(product, index)}
                                >
                                  <div className="font-bold flex justify-between">
                                    <span>{product.name}</span>
                                    <span className="text-primary">{formatMoney(product.unitPrice)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="p-2">
                          <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number" step="any" {...field}
                                  className="h-10 text-right bg-transparent border-transparent group-hover:border-border/50 focus:border-ring focus:bg-white"
                                  onChange={e => { field.onChange(e); calculateRowTotal(index); }}
                                />
                              </FormControl>
                            </FormItem>
                          )} />
                        </TableCell>
                        <TableCell className="p-2">
                          <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number" step="any" {...field}
                                  className="h-10 text-right bg-transparent border-transparent group-hover:border-border/50 focus:border-ring focus:bg-white"
                                  onChange={e => { field.onChange(e); calculateRowTotal(index); }}
                                />
                              </FormControl>
                            </FormItem>
                          )} />
                        </TableCell>
                        <TableCell className="p-2">
                          <FormField control={form.control} name={`items.${index}.total`} render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" readOnly {...field} className="h-10 text-right font-bold bg-transparent border-transparent focus:ring-0 focus:border-transparent" />
                              </FormControl>
                            </FormItem>
                          )} />
                        </TableCell>
                        <TableCell className="p-2 text-center">
                          <Button
                            type="button" variant="ghost" size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => { if (fields.length > 1) remove(index); }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* TOTALS & PAYMENT SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/60 shadow-md h-full">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-display font-bold border-b pb-2">Notas y Observaciones</h3>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea {...field} placeholder="Observaciones adicionales, tiempos específicos de instalación, garantías..." className="min-h-[120px] resize-none" />
                    </FormControl>
                  </FormItem>
                )} />
                <p className="text-xs text-muted-foreground">La cláusula de "15 días laborables" y política de devoluciones se añade automáticamente en la impresión.</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-md h-full bg-sidebar-accent/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-display font-bold border-b pb-2 mb-4">Resumen y Pagos</h3>

                <div className="space-y-4">
                  <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                    <FormItem className="grid grid-cols-3 items-center gap-4">
                      <FormLabel className="col-span-1 text-right mt-2">Condición de Pago:</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="col-span-2 h-10 bg-white"><SelectValue placeholder="Seleccione" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="50%">50% Anticipo - 50% Instalación</SelectItem>
                          <SelectItem value="100%">100% Pagado</SelectItem>
                          <SelectItem value="contra_entrega">Contra Entrega</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-3 items-center gap-4 py-2">
                    <div className="col-span-1 text-right font-bold text-muted-foreground">Total Factura:</div>
                    <div className="col-span-2 text-right text-xl font-bold font-mono px-3 py-2 bg-white rounded-md border border-border">
                      {formatMoney(total)}
                    </div>
                  </div>

                  <FormField control={form.control} name="downPayment" render={({ field }) => (
                    <FormItem className="grid grid-cols-3 items-center gap-4">
                      <FormLabel className="col-span-1 text-right mt-2 font-bold text-primary">Abono Recibido:</FormLabel>
                      <FormControl className="col-span-2">
                        <Input type="number" step="any" {...field} className="h-11 text-right font-bold text-lg text-primary border-primary focus-visible:ring-primary bg-white" />
                      </FormControl>
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-3 items-center gap-4 py-2 border-t border-border/50">
                    <div className="col-span-1 text-right font-black text-lg">Balance Restante:</div>
                    <div className="col-span-2 text-right text-2xl font-black font-mono text-destructive px-3 py-2 bg-white rounded-md border-2 border-destructive/20 shadow-inner">
                      {formatMoney(remaining)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4 bg-white p-4 rounded-xl border border-border shadow-sm sticky bottom-4 z-10">
            <Button type="button" variant="outline" onClick={() => setLocation("/facturas")} className="h-12 px-8 font-bold">
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="h-12 px-10 font-bold bg-primary hover:bg-primary/90 text-white text-lg shadow-lg shadow-primary/30">
              <Save className="mr-2" size={20} />
              {isEditing ? "Guardar Cambios" : "Generar Factura"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
