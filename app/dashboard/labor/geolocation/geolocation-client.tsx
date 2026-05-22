"use client"

import * as React from "react"
import { GeolocationVerify } from "@/components/labor/geolocation-verify"
import { ClockInMap, type ClockInLocation, type BranchLocation } from "@/components/labor/clock-in-map"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { MapPin, Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"

interface BranchWithLocation {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  radius: number
}

export default function GeolocationClient() {
  const { data: session } = authClient.useSession()
  const [branches, setBranches] = React.useState<BranchWithLocation[]>([])
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>("")
  const [clockIns, setClockIns] = React.useState<ClockInLocation[]>([])
  const [loadingBranches, setLoadingBranches] = React.useState(true)
  const [loadingClockIns, setLoadingClockIns] = React.useState(false)

  const selectedBranch = branches.find(b => b.id === selectedBranchId)

  React.useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch("/api/branches")
        if (!res.ok) throw new Error("Error fetching branches")
        const data = await res.json()
        const branchList = (data.branches || data.data || data || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          latitude: b.latitude ?? null,
          longitude: b.longitude ?? null,
          radius: b.geofenceRadius ?? b.radius ?? 100,
        }))
        setBranches(branchList)
        if (branchList.length > 0 && !selectedBranchId) {
          const userBranchId = (session?.user as any)?.branchId
          const defaultBranch = branchList.find((b: BranchWithLocation) => b.id === userBranchId) || branchList[0]
          setSelectedBranchId(defaultBranch.id)
        }
      } catch (err) {
        console.error("Error fetching branches:", err)
        toast.error("Error al cargar sucursales")
      } finally {
        setLoadingBranches(false)
      }
    }
    fetchBranches()
  }, [session?.user])

  React.useEffect(() => {
    if (!selectedBranchId) return
    const fetchClockIns = async () => {
      setLoadingClockIns(true)
      try {
        const res = await fetch(`/api/shifts?branchId=${selectedBranchId}&limit=50&status=ACTIVE`)
        if (!res.ok) throw new Error("Error fetching shifts")
        const data = await res.json()
        const records: ClockInLocation[] = (data.data || data.sessions || []).map((s: any) => ({
          id: s.id,
          userId: s.userId || "",
          userName: s.userName || s.user?.name || "Empleado",
          userImage: s.userImage || s.user?.image,
          latitude: s.checkInGeolocation?.latitude ?? s.checkInGeolocation?.lat ?? 0,
          longitude: s.checkInGeolocation?.longitude ?? s.checkInGeolocation?.lng ?? 0,
          accuracy: s.checkInGeolocation?.accuracy ?? 0,
          timestamp: new Date(s.startedAt || s.checkInGeolocation?.timestamp || Date.now()),
          status: s.status === "ACTIVE" ? "ON_TIME" as const : "ON_TIME" as const,
        })).filter((r: ClockInLocation) => r.latitude !== 0 && r.longitude !== 0)
        setClockIns(records)
      } catch (err) {
        console.error("Error fetching clock-ins:", err)
        setClockIns([])
      } finally {
        setLoadingClockIns(false)
      }
    }
    fetchClockIns()
  }, [selectedBranchId])

  const handleClockInSuccess = (result: any) => {
    toast.success(result.message || "Entrada registrada exitosamente")
    if (selectedBranchId) {
      const refreshClockIns = async () => {
        try {
          const res = await fetch(`/api/shifts?branchId=${selectedBranchId}&limit=50&status=ACTIVE`)
          if (res.ok) {
            const data = await res.json()
            const records: ClockInLocation[] = (data.data || data.sessions || []).map((s: any) => ({
              id: s.id,
              userId: s.userId || "",
              userName: s.userName || s.user?.name || "Empleado",
              userImage: s.userImage || s.user?.image,
              latitude: s.checkInGeolocation?.latitude ?? s.checkInGeolocation?.lat ?? 0,
              longitude: s.checkInGeolocation?.longitude ?? s.checkInGeolocation?.lng ?? 0,
              accuracy: s.checkInGeolocation?.accuracy ?? 0,
              timestamp: new Date(s.startedAt || s.checkInGeolocation?.timestamp || Date.now()),
              status: "ON_TIME" as const,
            })).filter((r: ClockInLocation) => r.latitude !== 0 && r.longitude !== 0)
            setClockIns(records)
          }
        } catch {}
      }
      refreshClockIns()
    }
  }

  const handleClockInError = (error: any) => {
    toast.error(error?.message || "Error al registrar entrada")
  }

  const branchLocation: BranchLocation | undefined = selectedBranch?.latitude && selectedBranch?.longitude
    ? {
      id: selectedBranch.id,
      name: selectedBranch.name,
      latitude: selectedBranch.latitude,
      longitude: selectedBranch.longitude,
      radius: selectedBranch.radius,
    }
    : undefined

  if (loadingBranches) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verificación de Geolocalización</h1>
        <p className="text-muted-foreground">
          Registra tu entrada verificando tu ubicación GPS
        </p>
      </div>

      {branches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Sin sucursales configuradas</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Configura al menos una sucursal con ubicación para usar la verificación de geolocalización.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="max-w-sm">
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                    {!branch.latitude && !branch.longitude && " (sin ubicación)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="clock-in" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="clock-in">Registrar Entrada</TabsTrigger>
              <TabsTrigger value="map">Mapa de Asistencia</TabsTrigger>
            </TabsList>

            <TabsContent value="clock-in">
              {selectedBranch && branchLocation ? (
                <div className="flex items-center justify-center">
                  <GeolocationVerify
                    branchId={selectedBranch.id}
                    branchName={selectedBranch.name}
                    branchLocation={branchLocation}
                    onClockInSuccess={handleClockInSuccess}
                    onClockInError={handleClockInError}
                  />
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Sucursal sin ubicación</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Esta sucursal no tiene coordenadas GPS configuradas. Contacta al administrador para configurar la ubicación.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="map">
              {branchLocation ? (
                <ClockInMap
                  branch={branchLocation}
                  clockIns={clockIns}
                  onLocationClick={(location) => {
                    toast.info(`${location.userName} registró entrada a las ${new Date(location.timestamp).toLocaleTimeString()}`)
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Selecciona una sucursal con ubicación para ver el mapa.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>¿Cómo funciona la verificación de geolocalización?</CardTitle>
          <CardDescription>
            El sistema verifica que te encuentres dentro del radio permitido de la sucursal
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">1</div>
            <div className="font-medium">Obtén tu ubicación</div>
            <div className="text-sm text-muted-foreground">
              El sistema solicita permiso para acceder a tu ubicación GPS
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">2</div>
            <div className="font-medium">Verificación automática</div>
            <div className="text-sm text-muted-foreground">
              Se calcula la distancia a la sucursal y verifica que estés dentro del radio permitido
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">3</div>
            <div className="font-medium">Registro exitoso</div>
            <div className="text-sm text-muted-foreground">
              Si estás dentro del rango, se registra tu entrada automáticamente
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
