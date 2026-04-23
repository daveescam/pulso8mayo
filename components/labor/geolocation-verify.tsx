"use client"

import * as React from "react"
import { MapPin, Navigation, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

export interface GeolocationVerifyProps {
    branchId: string
    branchName: string
    branchLocation?: {
        latitude: number
        longitude: number
        radius?: number
    }
    onClockInSuccess?: (result: any) => void
    onClockInError?: (error: any) => void
}

interface GeolocationState {
    latitude: number | null
    longitude: number | null
    accuracy: number | null
    loading: boolean
    error: string | null
    permission: "granted" | "denied" | "prompt"
}

interface ClockInResult {
    success: boolean
    message: string
    distance: number
    withinRadius: boolean
}

export function GeolocationVerify({
    branchId,
    branchName,
    branchLocation,
    onClockInSuccess,
    onClockInError
}: GeolocationVerifyProps) {
    const [geoState, setGeoState] = React.useState<GeolocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        loading: false,
        error: null,
        permission: "prompt"
    })

    const [clockInResult, setClockInResult] = React.useState<ClockInResult | null>(null)
    const [isClockingIn, setIsClockingIn] = React.useState(false)

    const requestGeolocation = async () => {
        if (!("geolocation" in navigator)) {
            setGeoState(prev => ({
                ...prev,
                error: "La geolocalización no es soportada por tu navegador"
            }))
            return
        }

        setGeoState(prev => ({ ...prev, loading: true, error: null }))

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                )
            })

            setGeoState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                loading: false,
                error: null,
                permission: "granted"
            })

            toast.success("Ubicación obtenida exitosamente")
        } catch (error: any) {
            let errorMessage = "Error al obtener ubicación"

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "Permiso de ubicación denegado. Por favor habilita los permisos en tu navegador."
                    setGeoState(prev => ({ ...prev, permission: "denied" }))
                    break
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "Información de ubicación no disponible"
                    break
                case error.TIMEOUT:
                    errorMessage = "Tiempo de espera agotado al obtener ubicación"
                    break
            }

            setGeoState(prev => ({
                ...prev,
                loading: false,
                error: errorMessage
            }))

            toast.error(errorMessage)
        }
    }

    const handleClockIn = async () => {
        if (!geoState.latitude || !geoState.longitude) {
            toast.error("Primero obtén tu ubicación")
            return
        }

        setIsClockingIn(true)
        setClockInResult(null)

        try {
            const response = await fetch("/api/shifts/clock-in", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    branchId,
                    geolocation: {
                        latitude: geoState.latitude,
                        longitude: geoState.longitude,
                        accuracy: geoState.accuracy || undefined,
                        timestamp: Date.now()
                    }
                })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                setClockInResult({
                    success: true,
                    message: data.message,
                    distance: data.distance,
                    withinRadius: data.withinRadius
                })
                toast.success("Check-in realizado con éxito")
                onClockInSuccess?.(data)
            } else {
                setClockInResult({
                    success: false,
                    message: data.message || "Error al realizar check-in",
                    distance: data.distance || 0,
                    withinRadius: data.withinRadius || false
                })
                toast.error(data.message || "Error al realizar check-in")
                onClockInError?.(data)
            }
        } catch (error) {
            console.error("Clock-in error:", error)
            setClockInResult({
                success: false,
                message: "Error de conexión",
                distance: 0,
                withinRadius: false
            })
            toast.error("Error de conexión al realizar check-in")
        } finally {
            setIsClockingIn(false)
        }
    }

    const calculateDistanceToBranch = () => {
        if (!geoState.latitude || !geoState.longitude || !branchLocation?.latitude || !branchLocation?.longitude) {
            return null
        }

        // Haversine formula
        const R = 6371e3 // Earth's radius in meters
        const φ1 = (geoState.latitude * Math.PI) / 180
        const φ2 = (branchLocation.latitude * Math.PI) / 180
        const Δφ = ((branchLocation.latitude - geoState.latitude) * Math.PI) / 180
        const Δλ = ((branchLocation.longitude - geoState.longitude) * Math.PI) / 180

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    const distance = calculateDistanceToBranch()
    const allowedRadius = branchLocation?.radius || 100
    const distancePercentage = distance ? Math.min((distance / allowedRadius) * 100, 100) : 0
    const isWithinRadius = distance !== null && distance <= allowedRadius

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Verificación de Ubicación</CardTitle>
                        <CardDescription>{branchName}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Geolocation Status */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Tu ubicación</span>
                        </div>
                        {geoState.latitude && (
                            <Badge variant="secondary" className="text-xs">
                                Precisión: {Math.round(geoState.accuracy || 0)}m
                            </Badge>
                        )}
                    </div>

                    {geoState.error ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{geoState.error}</AlertDescription>
                        </Alert>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                onClick={requestGeolocation}
                                disabled={geoState.loading}
                                className="flex-1"
                                variant={geoState.latitude ? "outline" : "default"}
                            >
                                {geoState.loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Obteniendo...
                                    </>
                                ) : geoState.latitude ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Actualizar
                                    </>
                                ) : (
                                    <>
                                        <Navigation className="h-4 w-4 mr-2" />
                                        Obtener Ubicación
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {geoState.latitude && geoState.longitude && (
                        <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                            <div>Lat: {geoState.latitude.toFixed(6)}</div>
                            <div>Lng: {geoState.longitude.toFixed(6)}</div>
                        </div>
                    )}
                </div>

                {/* Distance to Branch */}
                {geoState.latitude && branchLocation && (
                    <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Distancia a sucursal</span>
                            </div>
                            <Badge variant={isWithinRadius ? "default" : "destructive"}>
                                {distance !== null ? `${Math.round(distance)}m` : "N/A"}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Tu ubicación</span>
                                <span>Radio permitido: {allowedRadius}m</span>
                            </div>
                            <Progress
                                value={distancePercentage}
                                indicatorClassName={isWithinRadius ? "bg-green-500" : "bg-red-500"}
                            />
                            <div className="flex justify-between text-xs">
                                <span>0m</span>
                                <span className={isWithinRadius ? "text-green-600" : "text-red-600"}>
                                    {isWithinRadius ? "✓ Dentro del rango" : "✗ Fuera de rango"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Clock-in Result */}
                {clockInResult && (
                    <Alert variant={clockInResult.success ? "default" : "destructive"}>
                        {clockInResult.success ? (
                            <CheckCircle2 className="h-4 w-4" />
                        ) : (
                            <AlertCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>
                            {clockInResult.success ? "Check-in Exitoso" : "Check-in Rechazado"}
                        </AlertTitle>
                        <AlertDescription>
                            {clockInResult.message}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleClockIn}
                    disabled={!geoState.latitude || isClockingIn}
                    className="w-full"
                    size="lg"
                >
                    {isClockingIn ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Realizando Check-in...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Registrar Entrada
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
