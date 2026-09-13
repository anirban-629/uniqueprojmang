import { NextRequest } from 'next/server';
import { realtimeHub } from '@flowline/mock-db';
import { RealtimeEvent } from '@flowline/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId');
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keep-alive comment
      controller.enqueue(encoder.encode(': flowline realtime stream connected\n\n'));

      const listener = (event: RealtimeEvent) => {
        // Filter by projectId if requested
        if (projectId && event.projectId !== projectId) return;

        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error('Error writing to SSE stream:', err);
        }
      };

      unsubscribe = realtimeHub.subscribe(listener);

      // Periodic keep-alive ping every 15s to keep proxy/edge connections alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        if (unsubscribe) unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },

    cancel() {
      if (unsubscribe) unsubscribe();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
