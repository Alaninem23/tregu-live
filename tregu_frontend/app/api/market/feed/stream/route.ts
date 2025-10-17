/**
 * Market Feed Stream - SSE (Server-Sent Events) endpoint
 * Provides real-time feed updates
 * 
 * Note: This is a simplified implementation. In production, this would connect
 * to a message queue (Kafka/Redis Pub/Sub) and stream events to clients.
 * For now, it returns an empty stream (no events) until backend is implemented.
 */

import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Set up SSE headers
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = encoder.encode('data: {"type":"connected","timestamp":"' + new Date().toISOString() + '"}\n\n');
      controller.enqueue(data);

      // Keep connection alive with heartbeat every 30s
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = encoder.encode(':heartbeat\n\n');
          controller.enqueue(heartbeat);
        } catch (err) {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        controller.close();
      });

      // TODO: Connect to backend event stream (Kafka/Redis Pub/Sub)
      // When backend is ready, subscribe to 'market-feed' topic and forward events:
      // 
      // eventBus.subscribe('market-feed', (event) => {
      //   const sseData = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
      //   controller.enqueue(sseData);
      // });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
