import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { AppLayout } from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Products from "@/pages/products";
import Staff from "@/pages/staff";
import Settings from "@/pages/settings";
import InvoiceList from "@/pages/invoices/index";
import InvoiceForm from "@/pages/invoices/form";
import InvoiceDetail from "@/pages/invoices/detail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected Routes wrapped in Layout */}
      <Route path="/">
        <AppLayout><Dashboard /></AppLayout>
      </Route>
      <Route path="/clientes">
        <AppLayout><Clients /></AppLayout>
      </Route>
      <Route path="/productos">
        <AppLayout><Products /></AppLayout>
      </Route>
      <Route path="/personal">
        <AppLayout><Staff /></AppLayout>
      </Route>
      <Route path="/configuracion">
        <AppLayout><Settings /></AppLayout>
      </Route>
      <Route path="/facturas">
        <AppLayout><InvoiceList /></AppLayout>
      </Route>
      <Route path="/facturas/nueva">
        <AppLayout><InvoiceForm /></AppLayout>
      </Route>
      <Route path="/facturas/:id/editar">
        <AppLayout><InvoiceForm /></AppLayout>
      </Route>
      <Route path="/facturas/:id">
        <AppLayout><InvoiceDetail /></AppLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
