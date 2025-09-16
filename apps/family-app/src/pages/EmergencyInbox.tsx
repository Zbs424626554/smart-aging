import React, { useEffect, useState } from 'react';
import WebSocketService from '../services/websocket.service';

type Payload = {
  alertId: string;
  elderlyId?: string;
  status: string;
  audioClip?: string; // base64 情况下为占位
  aiAnalysis?: string;
  createdAt?: string;
};

export default function EmergencyInbox({ currentUserId }: { currentUserId: string }) {
  const [items, setItems] = useState<Payload[]>([]);
  useEffect(() => {
    try { void WebSocketService.connect(currentUserId); } catch { }
    const handler = (data: Payload) => setItems(prev => [data, ...prev]);
    try { WebSocketService.addEventListener('emergency:updated', handler); } catch { }
    return () => { try { WebSocketService.removeEventListener('emergency:updated', handler); } catch { } };
  }, [currentUserId]);

  return (
    <div style={{ padding: 12 }}>
      {items.map(it => (
        <div key={it.alertId} style={{ border: '1px solid #eee', marginBottom: 12, padding: 8 }}>
          <div>告警ID: {it.alertId}</div>
          <div>状态: {it.status}</div>
          {it.aiAnalysis && <pre>{it.aiAnalysis}</pre>}
        </div>
      ))}
    </div>
  );
}