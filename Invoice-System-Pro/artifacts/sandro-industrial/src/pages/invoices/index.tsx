import { useState } from "react";
import { useListInvoices, InvoiceStatus } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatMoney, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FileText, Eye, Edit } from "lucide-react";

export default function InvoiceList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  const queryParams = { 
    search, 
    page, 
    limit: 15,
    ...(status !== "all" ? { status: status as InvoiceStatus } : {})
  };

  const { data, isLoading } = useListInvoices(queryParams);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Facturas y Cotizaciones</h1>
          <p className="text-muted-foreground mt-1">Gestión general de documentos de venta.</p>
        </div>
        <Link 
          href="/facturas/nueva" 
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-6 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={18} /> Nueva Factura
        </Link>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Buscar por N° de factura, cliente..." 
                className="pl-10 h-11 rounded-xl bg-background border-border/80"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="paid">Pagadas</SelectItem>
                  <SelectItem value="cancelled">Anuladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-sidebar">
                  <TableRow className="hover:bg-sidebar">
                    <TableHead className="text-white font-semibold">N° Factura</TableHead>
                    <TableHead className="text-white font-semibold">Fecha</TableHead>
                    <TableHead className="text-white font-semibold">Cliente</TableHead>
                    <TableHead className="text-white font-semibold text-right">Total</TableHead>
                    <TableHead className="text-white font-semibold text-center">Estado</TableHead>
                    <TableHead className="text-white font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">Cargando facturas...</TableCell>
                    </TableRow>
                  ) : !data || data.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-12">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <FileText size={48} className="mb-4 opacity-20" />
                          <p className="text-lg font-medium">No se encontraron facturas</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.data.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono font-bold text-primary">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="text-sm">{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell>
                          <div className="font-bold text-foreground truncate max-w-[200px]">{invoice.client?.name}</div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground">{formatMoney(invoice.total)}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                            invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            invoice.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : 'Anulada'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="icon" className="h-8 w-8 text-blue-600">
                              <Link href={`/facturas/${invoice.id}/editar`}><Edit size={14} /></Link>
                            </Button>
                            <Button asChild variant="outline" size="icon" className="h-8 w-8 text-primary border-primary hover:bg-primary hover:text-white transition-colors">
                              <Link href={`/facturas/${invoice.id}`}><Eye size={14} /></Link>
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
    </div>
  );
}
