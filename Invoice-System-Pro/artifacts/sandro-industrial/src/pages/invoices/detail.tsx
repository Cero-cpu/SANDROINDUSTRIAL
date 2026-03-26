import { useGetInvoice } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Printer, Edit, ArrowLeft } from "lucide-react";
import { formatMoney } from "@/lib/utils";

export default function InvoiceDetail() {
  const { id } = useParams();
  const { data: invoice, isLoading } = useGetInvoice(parseInt(id!));

  if (isLoading) return <div className="p-12 text-center">Cargando factura...</div>;
  if (!invoice) return <div className="p-12 text-center text-destructive">Factura no encontrada</div>;

  const handlePrint = () => {
    window.print();
  };

  // Enforce exactly 8+ rows for the print layout
  const minRows = 8;
  const itemsCount = invoice.items?.length || 0;
  const rowsNeeded = Math.max(minRows, itemsCount);

  const displayItems = Array.from({ length: rowsNeeded }).map((_, index) => {
    if (invoice.items && index < itemsCount) {
      return invoice.items[index];
    }
    return { description: "", quantity: 0, unitPrice: 0, total: 0 };
  });

  const remaining = invoice.total - (invoice.downPayment || 0);

  return (
    <div className="max-w-[210mm] mx-auto animate-in fade-in duration-300">
      {/* Controls - Hidden on print */}
      <div className="flex justify-between items-center mb-6 no-print bg-white p-4 rounded-xl border border-border shadow-sm">
        <Button variant="outline" asChild className="h-10">
          <Link href="/facturas"><ArrowLeft className="mr-2" size={16} /> Volver</Link>
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="h-10 border-blue-200 text-blue-700 hover:bg-blue-50">
            <Link href={`/facturas/${invoice.id}/editar`}><Edit className="mr-2" size={16} /> Editar</Link>
          </Button>
          <Button onClick={handlePrint} className="h-10 bg-sidebar text-white hover:bg-sidebar/90 font-bold px-6 shadow-md">
            <Printer className="mr-2" size={18} /> Imprimir Factura
          </Button>
        </div>
      </div>

      {/* PRINT AREA - MUST MATCH PHYSICAL INVOICE EXACTLY */}
      <div id="invoice-print-area" className="bg-white p-8 sm:p-10 shadow-xl border border-border/50 rounded-xl print:shadow-none print:border-none print:p-0 print:rounded-none">

        {/* Header Grid */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 border-[3px] border-primary flex items-center justify-center rounded-lg">
              <span className="font-display font-black text-5xl text-primary tracking-tighter">
                S<span className="text-secondary">I</span>
              </span>
            </div>
            <div>
              <h1 className="font-display font-black text-3xl tracking-widest text-foreground m-0 leading-none">SANDRO</h1>
              <h2 className="font-display font-bold text-xl tracking-[0.25em] text-secondary m-0 leading-none">INDUSTRIAL</h2>
              <p className="text-xs font-semibold mt-1 max-w-[250px] leading-tight">
                Ventas, Fabricación de Ventanas Corredizas y Proyectadas, Puertas, Closets, Sheetrock, etc.
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold text-lg text-primary m-0 leading-tight">Factura N° {invoice.invoiceNumber}</p>
            <p className="font-bold m-0 leading-tight mt-1">RCN: 131143662</p>
            <p className="m-0 leading-tight mt-1 max-w-[200px] ml-auto">C/ Duarte, Sector Los Amapolos.</p>
            <p className="font-bold m-0 leading-tight mt-1">TEL: 809-296-0996</p>
            <p className="font-bold m-0 leading-tight">CEL: 809-559-9744</p>
          </div>
        </div>

        {/* Client Block */}
        <div className="border-2 border-primary rounded-lg p-3 mb-6 grid grid-cols-12 gap-x-4 gap-y-2 text-sm">
          <div className="col-span-8 flex border-b border-gray-300 pb-1">
            <span className="font-bold mr-2 whitespace-nowrap text-primary">Cliente:</span>
            <span className="font-bold flex-1 border-b border-dotted border-gray-400 px-1">{invoice.client?.name}</span>
          </div>
          <div className="col-span-4 flex border-b border-gray-300 pb-1">
            <span className="font-bold mr-2 whitespace-nowrap text-primary">Fecha:</span>
            <span className="flex-1 border-b border-dotted border-gray-400 px-1">{invoice.budgetDate ? new Date(invoice.budgetDate).toLocaleDateString('es-DO') : ''}</span>
          </div>

          <div className="col-span-12 flex border-b border-gray-300 pb-1">
            <span className="font-bold mr-2 whitespace-nowrap text-primary">Dirección:</span>
            <span className="flex-1 border-b border-dotted border-gray-400 px-1">{invoice.client?.address || ' '}</span>
          </div>

          <div className="col-span-6 flex pb-1 border-b border-gray-300">
            <span className="font-bold mr-2 whitespace-nowrap text-primary">Teléfono:</span>
            <span className="flex-1 border-b border-dotted border-gray-400 px-1">{invoice.client?.phone || ' '}</span>
          </div>
          <div className="col-span-6 flex pb-1 border-b border-gray-300">
            <span className="font-bold mr-2 whitespace-nowrap text-primary">Celular:</span>
            <span className="flex-1 border-b border-dotted border-gray-400 px-1">{invoice.client?.mobile || ' '}</span>
          </div>

          <div className="col-span-12 flex pb-1 mt-2">
            <span className="font-bold mr-2 whitespace-nowrap text-primary uppercase text-xs">Fecha Estimada de Entrega:</span>
            <span className="flex-1 px-4 font-black uppercase tracking-widest bg-amber-50 print-exact-bg border-2 border-primary text-center py-1 rounded">
              {invoice.deliveryDate || 'POR DEFINIR'}
            </span>
          </div>
        </div>

        {/* Table Area */}
        <div className="border-2 border-primary rounded-lg overflow-hidden mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-primary text-white">
                <th className="border-r border-primary/20 p-1.5 w-16 text-center font-bold">CANT.</th>
                <th className="border-r border-primary/20 p-1.5 text-left font-bold pl-3">DESCRIPCIÓN</th>
                <th className="border-r border-primary/20 p-1.5 w-28 text-center font-bold">PRECIO</th>
                <th className="p-1.5 w-32 text-center font-bold">VALOR (RD$)</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item, i) => (
                <tr key={i} className="border-b border-gray-300 last:border-b-0 h-[28px]">
                  <td className="border-r border-gray-300 p-1 text-center font-mono font-semibold">{item.quantity > 0 ? item.quantity : ''}</td>
                  <td className="border-r border-gray-300 p-1 pl-3 font-semibold">{item.description}</td>
                  <td className="border-r border-gray-300 p-1 text-right pr-2">{item.unitPrice > 0 ? formatMoney(item.unitPrice).replace('RD$', '') : ''}</td>
                  <td className="p-1 text-right pr-2 font-bold">{item.total > 0 ? formatMoney(item.total).replace('RD$', '') : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Area */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 text-[11px] leading-tight space-y-2">
            <p className="font-bold italic">Condiciones:</p>
            <p>1. Todo trabajo tiene un plazo mínimo de 15 días laborables.</p>
            <p>2. No se acepta devolución de dinero una vez iniciado el trabajo o cortado el material.</p>
            <p>3. En caso de cancelación por parte del cliente, el anticipo será retenido por gastos operativos.</p>
            {invoice.notes && (
              <div className="mt-2 p-2 border border-gray-300 rounded bg-gray-50">
                <span className="font-bold">Nota:</span> {invoice.notes}
              </div>
            )}

            <div className="mt-8 flex justify-around border-t-2 border-black pt-1 w-3/4 max-w-sm mx-auto">
              <span className="font-bold">Firma Cliente / Recibido Conforme</span>
            </div>
          </div>

          <div className="col-span-4 border-2 border-primary rounded-lg overflow-hidden h-min">
            <div className="flex border-b border-gray-300">
              <div className="w-1/2 p-1.5 font-bold text-right border-r border-gray-300 text-sm">TOTAL RD$</div>
              <div className="w-1/2 p-1.5 text-right font-bold font-mono">{formatMoney(invoice.total).replace('RD$', '')}</div>
            </div>
            <div className="flex border-b border-gray-300 bg-gray-100">
              <div className="w-1/2 p-1.5 font-bold text-right border-r border-gray-300 text-sm text-primary">ABONO RD$</div>
              <div className="w-1/2 p-1.5 text-right font-bold font-mono text-primary">{formatMoney(invoice.downPayment).replace('RD$', '')}</div>
            </div>
            <div className="flex">
              <div className="w-1/2 p-1.5 font-bold text-right border-r border-gray-300 text-sm">RESTA RD$</div>
              <div className="w-1/2 p-1.5 text-right font-bold font-mono">{formatMoney(remaining).replace('RD$', '')}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
