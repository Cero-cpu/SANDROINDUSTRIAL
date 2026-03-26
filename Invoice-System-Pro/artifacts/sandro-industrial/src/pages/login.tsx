import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { generateDemoToken } from "@/lib/mock-data";

// Demo mode detection
const DEMO_MODE = import.meta.env.PROD && !import.meta.env.VITE_API_URL;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { setToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    const startTime = Date.now();

    try {
      let token: string;

      if (DEMO_MODE) {
        // Demo mode: accept any credentials
        await new Promise((r) => setTimeout(r, 800));
        token = generateDemoToken();
      } else {
        // Real mode: call the API
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          throw new Error("Invalid credentials");
        }

        const data = await res.json();
        token = data.token;
      }

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 1500 - elapsed);

      await new Promise((r) => setTimeout(r, remaining));
      setToken(token);
      setLoginSuccess(true);

      setTimeout(() => {
        toast({ title: "Bienvenido", description: "Inicio de sesión exitoso." });
        setLocation("/");
      }, 600);
    } catch {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 800 - elapsed);
      await new Promise((r) => setTimeout(r, remaining));
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Credenciales inválidas. Por favor intente nuevamente.",
      });
    }
  };

  // Full-screen success overlay
  if (loginSuccess) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-lg font-display font-bold text-foreground">Accediendo al sistema...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-zinc-950 p-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
            alt="Sandro Industrial"
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-2xl flex items-center justify-center border-4 border-primary">
            <span className="font-display font-black text-4xl text-primary tracking-tighter">
              S<span className="text-secondary">I</span>
            </span>
          </div>
          <div>
            <h1 className="font-display font-black text-3xl text-white tracking-widest leading-none">SANDRO</h1>
            <h1 className="font-display font-bold text-xl text-secondary tracking-[0.3em] leading-none">INDUSTRIAL</h1>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="font-display font-bold text-4xl text-white mb-6 leading-tight">
            Sistema de Facturación y Gestión
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Plataforma corporativa para la gestión de facturas, clientes, inventario de productos y personal administrativo de Sandro Industrial.
          </p>
        </div>

        <div className="relative z-10 text-zinc-500 text-sm">
          &copy; {new Date().getFullYear()} Sandro Industrial. Todos los derechos reservados.
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 bg-background relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center border-2 border-primary">
                <span className="font-display font-black text-2xl text-primary tracking-tighter">
                  S<span className="text-secondary">I</span>
                </span>
              </div>
              <div className="text-left">
                <h1 className="font-display font-black text-xl text-foreground tracking-widest leading-none">SANDRO</h1>
                <h1 className="font-display font-bold text-sm text-secondary tracking-[0.2em] leading-none">INDUSTRIAL</h1>
              </div>
            </div>
            <h2 className="font-display font-bold text-3xl text-foreground tracking-tight">Iniciar Sesión</h2>
            <p className="text-muted-foreground mt-2">Ingrese sus credenciales para acceder al sistema.</p>
          </div>

          <Card className="border-border/50 shadow-xl shadow-black/5 bg-white/50 backdrop-blur-sm">
            <CardContent className="pt-8 px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@sandroindustrial.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-white"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Verificando...
                    </span>
                  ) : "Ingresar al Sistema"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {DEMO_MODE && (
            <p className="text-center text-xs text-muted-foreground/70">
              Modo demostración — Ingrese cualquier email y contraseña.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
