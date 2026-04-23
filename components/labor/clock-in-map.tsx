"use client"

import * as React from "react"
import { MapPin, Navigation, Users, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export interface ClockInLocation {
    id: string
    userId: string
    userName: string
    userImage?: string
    latitude: number
    longitude: number
    accuracy: number
    timestamp: Date
    status: "ON_TIME" | "LATE" | "EARLY"
}

export interface BranchLocation {
    id: string
    name: string
    latitude: number
    longitude: number
    radius: number
}

interface ClockInMapProps {
    branch: BranchLocation
    clockIns: ClockInLocation[]
    selectedDate?: Date
    onLocationClick?: (location: ClockInLocation) => void
}

// Simple map visualization using CSS
// For production, consider using Google Maps, Mapbox, or Leaflet
export function ClockInMap({
    branch,
    clockIns,
    selectedDate = new Date(),
    onLocationClick
}: ClockInMapProps) {
    const [hoveredLocation, setHoveredLocation] = React.useState<ClockInLocation | null>(null)

    // Convert coordinates to pixel positions relative to branch
    const getPosition = (lat: number, lng: number) => {
        const branchLat = branch.latitude
        const branchLng = branch.longitude

        // Simple equirectangular projection for small distances
        const x = (lng - branchLng) * 111320 * Math.cos((branchLat * Math.PI) / 180)
        const y = (branchLat - lat) * 110540

        return { x, y }
    }

    // Calculate bounds to fit all points
    const allPositions = [
        { x: 0, y: 0 }, // Branch at center
        ...clockIns.map(c => getPosition(c.latitude, c.longitude))
    ]

    const maxX = Math.max(...allPositions.map(p => Math.abs(p.x)))
    const maxY = Math.max(...allPositions.map(p => Math.abs(p.y)))
    const maxRange = Math.max(maxX, maxY) || 100 // Default 100m if no data

    // Scale to fit in container (400px = maxRange meters)
    const scale = 200 / maxRange

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Mapa de Check-ins
                        </CardTitle>
                        <CardDescription>
                            {branch.name} - {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                        </CardDescription>
                    </div>
                    <Badge variant="outline">
                        {clockIns.length} check-ins hoy
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Map Visualization */}
                    <div className="relative aspect-square bg-muted/30 rounded-lg border overflow-hidden">
                        {/* Branch location (center) */}
                        <div
                            className="absolute z-20"
                            style={{
                                left: "50%",
                                top: "50%",
                                transform: "translate(-50%, -50%)"
                            }}
                        >
                            <div className="relative">
                                {/* Allowed radius circle */}
                                <div
                                    className="absolute border-2 border-green-500/30 bg-green-500/10 rounded-full"
                                    style={{
                                        width: `${(branch.radius * scale * 2)}px`,
                                        height: `${(branch.radius * scale * 2)}px`,
                                        left: "50%",
                                        top: "50%",
                                        transform: "translate(-50%, -50%)"
                                    }}
                                />
                                {/* Branch marker */}
                                <div className="relative z-10 bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                {/* Branch label */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs font-medium whitespace-nowrap bg-background px-2 py-1 rounded shadow">
                                    {branch.name}
                                </div>
                            </div>
                        </div>

                        {/* Employee clock-in locations */}
                        {clockIns.map(clockIn => {
                            const pos = getPosition(clockIn.latitude, clockIn.longitude)
                            const scaledX = pos.x * scale
                            const scaledY = pos.y * scale

                            const isLate = clockIn.status === "LATE"
                            const isEarly = clockIn.status === "EARLY"

                            return (
                                <div
                                    key={clockIn.id}
                                    className="absolute z-30 cursor-pointer transition-transform hover:scale-125"
                                    style={{
                                        left: `calc(50% + ${scaledX}px)`,
                                        top: `calc(50% + ${scaledY}px)`,
                                        transform: "translate(-50%, -50%)"
                                    }}
                                    onMouseEnter={() => setHoveredLocation(clockIn)}
                                    onMouseLeave={() => setHoveredLocation(null)}
                                    onClick={() => onLocationClick?.(clockIn)}
                                >
                                    <div className="relative">
                                        {/* Pulse animation for recent check-ins */}
                                        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                                        {/* User marker */}
                                        <Avatar className="h-8 w-8 border-2 border-primary shadow-lg">
                                            <AvatarImage src={clockIn.userImage} />
                                            <AvatarFallback className="text-xs">
                                                {clockIn.userName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {/* Status indicator */}
                                        <div
                                            className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${
                                                isLate
                                                    ? "bg-red-500"
                                                    : isEarly
                                                    ? "bg-yellow-500"
                                                    : "bg-green-500"
                                            }`}
                                        />
                                    </div>
                                </div>
                            )
                        })}

                        {/* Map legend */}
                        <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur p-2 rounded border text-xs space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-primary" />
                                <span>Sucursal</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-green-500" />
                                <span>A tiempo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                <span>Temprano</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-500" />
                                <span>Tarde</span>
                            </div>
                        </div>
                    </div>

                    {/* Clock-in List */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        <h4 className="text-sm font-medium sticky top-0 bg-background py-2 z-10">
                            Empleados que registraron entrada
                        </h4>
                        {clockIns.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-8">
                                No hay check-ins registrados hoy
                            </div>
                        ) : (
                            clockIns.map(clockIn => (
                                <div
                                    key={clockIn.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                        hoveredLocation?.id === clockIn.id
                                            ? "bg-muted"
                                            : "bg-card hover:bg-muted/50"
                                    }`}
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={clockIn.userImage} />
                                        <AvatarFallback>
                                            {clockIn.userName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{clockIn.userName}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(clockIn.timestamp), "HH:mm")}
                                            <span className="ml-2">
                                                {Math.round(clockIn.accuracy)}m precisión
                                            </span>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={
                                            clockIn.status === "ON_TIME"
                                                ? "default"
                                                : clockIn.status === "EARLY"
                                                ? "secondary"
                                                : "destructive"
                                        }
                                        className="text-xs"
                                    >
                                        {clockIn.status === "ON_TIME"
                                            ? "A tiempo"
                                            : clockIn.status === "EARLY"
                                            ? "Temprano"
                                            : "Tarde"}
                                    </Badge>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Hover tooltip */}
                {hoveredLocation && (
                    <div className="mt-4 p-3 bg-muted rounded-lg border text-sm">
                        <div className="font-medium">{hoveredLocation.userName}</div>
                        <div className="text-muted-foreground">
                            Registró entrada a las {format(new Date(hoveredLocation.timestamp), "HH:mm 'hrs'")}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                            <div className="flex items-center gap-1">
                                <Navigation className="h-3 w-3" />
                                {Math.round(
                                    Math.sqrt(
                                        Math.pow(
                                            getPosition(hoveredLocation.latitude, hoveredLocation.longitude).x,
                                            2
                                        ) +
                                            Math.pow(
                                                getPosition(hoveredLocation.latitude, hoveredLocation.longitude).y,
                                                2
                                            )
                                    )
                                )}
                                m de la sucursal
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {hoveredLocation.latitude.toFixed(6)}, {hoveredLocation.longitude.toFixed(6)}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
