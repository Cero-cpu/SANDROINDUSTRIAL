import { useGetDashboardMetrics } from "@workspace/api-client-react";
import { formatMoney } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileText, DollarSign, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboardMetrics();

  if (isLoading) return (
    <div className="flex-1 flex flex-col gap-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-48 mb-4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
      </div>
      <div className="h-[400px] bg-muted rounded-xl mt-6"></div>
    </div>
  );

  if (error || !data) return (
    <div className="p-8 text-center bg-destructive/10 text-destructive rounded-xl border border-destructive/20">
      <h3 className="font-bold text-lg">Error cargando métricas</h3>
      <p>Ocurrió un error al cargar el dashboard. Intente recargar la página.</p>
    </div>
  );

  const stats = [
    { title: "Facturas del Mes", value: data.monthInvoices, icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Ingresos del Mes", value: formatMoney(data.monthRevenue), icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
    { title: "Facturas Pendientes", value: data.pendingInvoices, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Facturas Pagadas", value: data.paidInvoices, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Resumen general de facturación y métricas.</p>
        </div>
        <Link 
          href="/facturas/nueva" 
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 px-8 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
        >
          <FileText size={18} />
          Crear Nueva Factura
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border/60 shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold font-display tracking-tight text-foreground mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card className="lg:col-span-2 border-border/60 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold font-display">Ingresos (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyRevenue} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(value) => `RD$${value >= 1000 ? (value / 1000) + 'k' : value}`}
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatMoney(value), 'Ingresos']}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="hsl(var(--primary))" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-lg font-bold font-display flex items-center justify-between">
              Últimas Facturas
              <Link href="/facturas" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                Ver todas <ArrowRight size={14} />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {data.recentInvoices.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No hay facturas recientes
                </div>
              ) : (
                data.recentInvoices.map((invoice) => (
                  <Link key={invoice.id} href={`/facturas/${invoice.id}`} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                    <div>
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[150px]">{invoice.client?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatMoney(invoice.total)}</p>
                      <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        invoice.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : 'Anulada'}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
