"use client"

import * as React from "react"
import { GeolocationVerify } from "@/components/labor/geolocation-verify"
import { ClockInMap } from "@/components/labor/clock-in-map"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

// Mock data - in production, fetch from API
const MOCK_BRANCH = {
    id: "branch-1",
    name: "Sucursal Centro",
    latitude: 19.4326,
    longitude: -99.1332,
    radius: 100
}

const MOCK_CLOCK_INS = [
    {
        id: "1",
        userId: "user-1",
        userName: "Juan Pérez",
        userImage: "/avatars/juan.jpg",
        latitude: 19.4330,
        longitude: -99.1335,
        accuracy: 10,
        timestamp: new Date("2024-01-15T08:55:00"),
        status: "ON_TIME" as const
    },
    {
        id: "2",
        userId: "user-2",
        userName: "María García",
        userImage: "/avatars/maria.jpg",
        latitude: 19.4320,
        longitude: -99.1340,
        accuracy: 15,
        timestamp: new Date("2024-01-15T09:05:00"),
        status: "LATE" as const
    },
    {
        id: "3",
        userId: "user-3",
        userName: "Carlos López",
        latitude: 19.4335,
        longitude: -99.1330,
        accuracy: 8,
        timestamp: new Date("2024-01-15T08:45:00"),
        status: "EARLY" as const
    }
]

export default function GeolocationPage() {
    const [clockIns, setClockIns] = React.useState(MOCK_CLOCK_INS)

    const handleClockInSuccess = (result: any) => {
        console.log("Clock-in success:", result)
        // In production, refresh the clock-ins list from API
    }

    const handleClockInError = (error: any) => {
        console.error("Clock-in error:", error)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Verificación de Geolocalización</h1>
                <p className="text-muted-foreground">
                    Registra tu entrada verificando tu ubicación GPS
                </p>
            </div>

            <Tabs defaultValue="clock-in" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="clock-in">Registrar Entrada</TabsTrigger>
                    <TabsTrigger value="map">Mapa de Asistencia</TabsTrigger>
                </TabsList>

                {/* Clock-in Tab */}
                <TabsContent value="clock-in">
                    <div className="flex items-center justify-center">
                        <GeolocationVerify
                            branchId={MOCK_BRANCH.id}
                            branchName={MOCK_BRANCH.name}
                            branchLocation={MOCK_BRANCH}
                            onClockInSuccess={handleClockInSuccess}
                            onClockInError={handleClockInError}
                        />
                    </div>
                </TabsContent>

                {/* Map Tab */}
                <TabsContent value="map">
                    <ClockInMap
                        branch={MOCK_BRANCH}
                        clockIns={clockIns}
                        onLocationClick={(location) => {
                            toast.info(`${location.userName} registró entrada a las ${new Date(location.timestamp).toLocaleTimeString()}`)
                        }}
                    />
                </TabsContent>
            </Tabs>

            {/* Information Card */}
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
