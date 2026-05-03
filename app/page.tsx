import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ClipboardCheck,
  BarChart3,
  Shield,
  MessageSquare,
  Package,
  Users,
  Clock,
  Zap,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Brain,
} from "lucide-react"

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Pulso</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Iniciar Sesión</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Comenzar Gratis</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <Badge variant="secondary" className="mb-6">
          Plataforma #1 para HORECA en México
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-4xl mx-auto leading-tight">
          Opera, cumple y crece con{" "}
          <span className="text-primary">inteligencia</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          La plataforma integral de gestión operativa y cumplimiento normativo para hoteles, restaurantes y cafés.
          Automatiza workflows, controla inventario y cumple NOM-251/NOM-035 desde un solo lugar.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 text-base px-8">
              Comenzar Gratis <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="text-base px-8">
              Iniciar Sesión
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
          Sin tarjeta de crédito · Configura en 5 minutos · Soporte WhatsApp
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <ClipboardCheck className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Workflows Inteligentes</CardTitle>
              <CardDescription>
                Crea y automatiza checklists de apertura, cierre, recepción de mercancía y control de calidad.
                Verificación con IA integrada.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <Package className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Inventario en Tiempo Real</CardTitle>
              <CardDescription>
                Seguimiento de stock por lote y fecha de caducidad. Alertas automáticas de bajo stock y FIFO integrado.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Cumplimiento NOM-251/035</CardTitle>
              <CardDescription>
                Reportes auditables para COFEPRIS y STPS. Generación automática de expedientes de cumplimiento.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">WhatsApp First</CardTitle>
              <CardDescription>
                Ejecuta workflows, recibe alertas y confirma tareas directamente desde WhatsApp. Sin instalar nada extra.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Gestión de Personal</CardTitle>
              <CardDescription>
                Control de asistencia con geolocalización, gestión de turnos, horas extra y cumplimiento de LFT.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Analítica y KPIs</CardTitle>
              <CardDescription>
                Dashboards ejecutivos, comparación entre sucursales y reportes programados con tendencias.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-zinc-900 dark:text-zinc-50">
          ¿Por qué Pulso?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">60%</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Reducción de tareas manuales con workflows automatizados</div>
          </div>
          <div className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">100%</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Cumplimiento con regulaciones de seguridad alimentaria</div>
          </div>
          <div className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">30%</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Menos desperdicio de inventario con monitoreo IA</div>
          </div>
          <div className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">&lt;2s</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Tiempo de respuesta en todas las interacciones</div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-12 px-8 text-center space-y-6">
            <Smartphone className="h-12 w-12 mx-auto opacity-80" />
            <h2 className="text-2xl sm:text-3xl font-bold">
              Tu operación, desde WhatsApp
            </h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto text-lg">
              Envía y recibe workflows, recibe alertas de cumplimiento y gestiona tu equipo sin abandonar la app que ya usas.
            </p>
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
                Comenzar Ahora <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Pulso HORECA</span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} Pulso. Gestión operativa para HORECA.
          </p>
        </div>
      </footer>
    </div>
  )
}
