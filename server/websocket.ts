import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

export type WSMessage =
  | { type: "bid_placed"; auctionId: string; amount: string; bidCount: number; brokerId: string }
  | { type: "auction_extended"; auctionId: string; newEndTime: string }
  | { type: "auction_ended"; auctionId: string }
  | { type: "auction_settled"; auctionId: string; winnerId?: string };

let wss: WebSocketServer;

export function setupWebSocket(httpServer: Server) {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    ws.on("error", console.error);
  });

  return wss;
}

export function broadcast(message: WSMessage) {
  if (!wss) return;
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
