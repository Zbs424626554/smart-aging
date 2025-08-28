export class MicRecorder {
  private mediaRecorder?: MediaRecorder;
  private chunks: Blob[] = [];

  async start(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    this.mediaRecorder.ondataavailable = e => { if (e.data.size > 0) this.chunks.push(e.data); };
    this.mediaRecorder.start();
  }

  async stop(): Promise<Blob> {
    const rec = this.mediaRecorder;
    if (!rec) throw new Error('not started');
    await new Promise<void>(resolve => {
      rec.onstop = () => resolve();
      rec.stop();
    });
    const blob = new Blob(this.chunks, { type: 'audio/webm' });
    (rec.stream.getTracks() || []).forEach(t => t.stop());
    return blob;
  }
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

