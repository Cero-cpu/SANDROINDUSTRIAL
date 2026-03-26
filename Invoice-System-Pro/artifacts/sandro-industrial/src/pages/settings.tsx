import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">Preferencias del sistema y datos de la empresa.</p>
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-display">
            <SettingsIcon className="text-primary" /> Datos de la Empresa
          </CardTitle>
          <CardDescription>Esta información se mostrará en las facturas impresas (Configurado por defecto).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground font-semibold">Nombre:</span>
              <p className="font-bold text-foreground">Sandro Industrial</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground font-semibold">RCN:</span>
              <p className="font-mono text-foreground">131143662</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground font-semibold">Teléfonos:</span>
              <p className="text-foreground">809-296-0996 / 809-559-9744</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground font-semibold">Dirección:</span>
              <p className="text-foreground">C/ Duarte, Sector Los Amapolos.</p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-border/50 text-center text-muted-foreground">
            Funciones avanzadas de configuración próximamente disponibles.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
