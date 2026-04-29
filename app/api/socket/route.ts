// Socket.io is an optional dependency - import dynamically
// @ts-expect-error socket.io may not be installed
import type { Server as SocketIOServer } from "socket.io";
import { Server as NetServer } from "http";
import { NextRequest, NextResponse } from "next/server";

// Store Socket.IO server instance globally for hot-reloading
const globalForSocket = global as unknown as {
  socketIoServer?: SocketIOServer;
  httpServer?: NetServer;
};

/**
 * GET handler - Establishes Socket.IO connection
 * This is a special endpoint that handles WebSocket upgrade
 */
export async function GET(req: NextRequest) {
  // Socket.IO requires access to the underlying HTTP server
  // In Next.js App Router, we use the request's socket for upgrade
  const upgrade = req.headers.get("upgrade");

  if (upgrade === "websocket") {
    // Return instructions for WebSocket upgrade
    return new NextResponse(
      JSON.stringify({
        error: "Use native WebSocket endpoint",
        info: "Socket.IO requires a custom server. Use /api/socket/native for WebSocket connections or run a separate Socket.IO server.",
      }),
      {
        status: 426,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return NextResponse.json({
    status: "Socket.IO server status",
    initialized: !!globalForSocket.socketIoServer,
    connectedClients: globalForSocket.socketIoServer
      ? (globalForSocket.socketIoServer as SocketIOServer).sockets.sockets.size
      : 0,
    message: "Socket.IO server runs on a separate process. Connect via WebSocket client to ws://localhost:3001 or use native WebSocket endpoint.",
  });
}

/**
 * POST handler - Triggers Socket.IO events from API routes
 * This allows emitting events to connected clients from REST endpoints
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, room, data } = body;

    if (!event || !room) {
      return NextResponse.json(
        { error: "Missing required fields: event, room" },
        { status: 400 }
      );
    }

    // If Socket.IO server is running, emit the event
    if (globalForSocket.socketIoServer) {
      const io = globalForSocket.socketIoServer;
      io.to(room).emit(event, data);
      return NextResponse.json({
        success: true,
        message: `Event '${event}' emitted to room '${room}'`,
        connectedClients: io.sockets.sockets.size,
      });
    }

    return NextResponse.json(
      {
        error: "Socket.IO server not running",
        message: "Connect to WebSocket server first",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("[Socket API] Error emitting event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
