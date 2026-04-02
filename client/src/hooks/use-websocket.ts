import { useEffect, useRef, useCallback } from "react";

type WSMessage =
  | { type: "bid_placed"; auctionId: string; amount: string; bidCount: number; brokerId: string }
  | { type: "auction_extended"; auctionId: string; newEndTime: string }
  | { type: "auction_ended"; auctionId: string }
  | { type: "auction_settled"; auctionId: string; winnerId?: string };

type MessageHandler = (message: WSMessage) => void;

export function useWebSocket(onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef<MessageHandler>(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws`;

    function connect() {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handlerRef.current(data);
        } catch {
        }
      };

      ws.onclose = () => {
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);
}
