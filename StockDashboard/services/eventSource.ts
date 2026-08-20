// Cross-Platform EventSource wrapper for Web & React Native (Hermes/JSC)
export class CustomEventSource {
  private url: string;
  private nativeInstance: any = null;
  private xhr: XMLHttpRequest | null = null;
  private listeners: Record<string, ((event: { data: string }) => void)[]> = {};

  public onopen: (() => void) | null = null;
  public onerror: ((error: any) => void) | null = null;
  public readyState: number = 0; // 0: CONNECTING, 1: OPEN, 2: CLOSED

  constructor(url: string) {
    this.url = url;
    this.init();
  }

  private init() {
    // If native browser EventSource exists (Web environment)
    if (typeof window !== 'undefined' && 'EventSource' in window && typeof (window as any).EventSource === 'function') {
      const ES = (window as any).EventSource;
      this.nativeInstance = new ES(this.url);

      this.nativeInstance.onopen = () => {
        this.readyState = 1;
        if (this.onopen) this.onopen();
      };

      this.nativeInstance.onerror = (err: any) => {
        this.readyState = 2;
        if (this.onerror) this.onerror(err);
      };
      return;
    }

    // React Native XMLHttpRequest chunked stream implementation with stream buffering
    try {
      const xhr = new XMLHttpRequest();
      this.xhr = xhr;
      let seenBytes = 0;
      let buffer = '';

      xhr.open('GET', this.url);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            if (this.readyState === 0) {
              this.readyState = 1;
              if (this.onopen) this.onopen();
            }

            const responseText = xhr.responseText || '';
            const newData = responseText.substring(seenBytes);
            seenBytes = responseText.length;
            buffer += newData;

            const parts = buffer.split('\n\n');
            // Retain incomplete trailing block in buffer for the next chunk
            buffer = parts.pop() || '';

            for (const block of parts) {
              if (!block.trim()) continue;
              const lines = block.split('\n');
              let eventName = 'message';
              let dataContent = '';

              for (const line of lines) {
                if (line.startsWith('event:')) {
                  eventName = line.substring(6).trim();
                } else if (line.startsWith('data:')) {
                  dataContent = line.substring(5).trim();
                }
              }

              if (dataContent && this.listeners[eventName]) {
                this.listeners[eventName].forEach((cb) => cb({ data: dataContent }));
              }
            }
          } else if (xhr.status >= 400) {
            this.readyState = 2;
            if (this.onerror) this.onerror(new Error(`HTTP ${xhr.status}`));
          }
        }
      };

      xhr.onerror = (err) => {
        this.readyState = 2;
        if (this.onerror) this.onerror(err);
      };

      xhr.send();
    } catch (err) {
      this.readyState = 2;
      if (this.onerror) this.onerror(err);
    }
  }

  public addEventListener(event: string, callback: (event: { data: string }) => void) {
    if (this.nativeInstance) {
      this.nativeInstance.addEventListener(event, callback);
      return;
    }
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public close() {
    this.readyState = 2;
    if (this.nativeInstance) {
      try {
        this.nativeInstance.close();
      } catch (e) {}
    }
    if (this.xhr) {
      try {
        this.xhr.abort();
      } catch (e) {}
    }
  }
}
