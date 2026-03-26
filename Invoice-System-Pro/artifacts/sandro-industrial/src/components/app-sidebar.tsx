import {
  LayoutDashboard,
  FileText,
  FilePlus,
  Users,
  Package,
  UserCheck,
  Settings,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Facturas", url: "/facturas", icon: FileText },
  { title: "Nueva Factura", url: "/facturas/nueva", icon: FilePlus, highlight: true },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Productos", url: "/productos", icon: Package },
];

const managementItems = [
  { title: "Personal", url: "/personal", icon: UserCheck },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  return (
    <Sidebar className="border-r-0 shadow-lg no-print">
      <div className="p-6 flex flex-col items-center justify-center space-y-3 bg-sidebar-accent/30 border-b border-sidebar-border">
        <div className="w-14 h-14 rounded-xl bg-white shadow-md flex items-center justify-center border-2 border-primary">
          <span className="font-display font-bold text-2xl text-primary tracking-tighter">
            S<span className="text-secondary">I</span>
          </span>
        </div>
        <div className="text-center">
          <h2 className="font-display font-bold text-white text-sm tracking-widest">SANDRO</h2>
          <h2 className="font-display font-bold text-white tracking-widest">INDUSTRIAL</h2>
        </div>
      </div>

      <SidebarContent className="px-3 py-4 space-y-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/90 text-xs font-bold uppercase tracking-wider mb-2">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={item.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-white transition-all shadow-md shadow-primary/20" : "text-white hover:text-white hover:bg-white/10"}
                    >
                      <Link href={item.url} className="font-semibold">
                        <item.icon className={item.highlight ? "text-white" : "text-white/90"} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/90 text-xs font-bold uppercase tracking-wider mb-2">
            Administración
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {managementItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className="text-white hover:text-white hover:bg-white/10">
                      <Link href={item.url} className="font-semibold">
                        <item.icon className="text-white/90" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border bg-sidebar-accent/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
            {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{user?.name || 'Usuario'}</p>
            <p className="text-xs text-white/80 font-medium truncate capitalize">{user?.role || 'admin'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive-foreground bg-destructive/10 hover:bg-destructive hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
