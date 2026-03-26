import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !user && location !== "/login") {
      window.location.href = "/login";
    }
  }, [user, isLoading, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && location !== "/login") {
    return null; // Will redirect
  }

  // Full page layout without sidebar for login
  if (location === "/login") {
    return <main className="min-h-screen w-full bg-background">{children}</main>;
  }

  // Print view (no sidebar wrapper styling)
  if (location.startsWith("/facturas/") && !location.endsWith("/editar") && location !== "/facturas/nueva") {
    // Actually, we can use print media queries to hide the sidebar, but a cleaner
    // DOM for print is often better. We'll rely on CSS `@media print { .no-print { display: none } }`
    // which is defined in index.css.
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "4rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-border/50 shadow-sm z-10 no-print sticky top-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-primary transition-colors" />
              <h1 className="font-display font-semibold text-lg text-foreground tracking-tight hidden sm:block">
                Sandro Industrial
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-semibold text-foreground">{new Intl.DateTimeFormat('es-DO', { dateStyle: 'full' }).format(new Date())}</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto relative">
            <div
              className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
              style={{
                backgroundImage: `url(${import.meta.env.BASE_URL}images/background.avif)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div className="p-4 md:p-6 lg:p-8 relative z-10 min-h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
