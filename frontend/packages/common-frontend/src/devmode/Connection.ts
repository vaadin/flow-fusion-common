export enum ConnectionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNAVAILABLE = 'unavailable',
  ERROR = 'error',
}

export class Connection extends Object {
  static HEARTBEAT_INTERVAL = 180000;

  status: ConnectionStatus = ConnectionStatus.UNAVAILABLE;

  webSocket?: WebSocket;

  constructor(url?: string) {
    super();

    if (url) {
      this.webSocket = new WebSocket(url);
      this.webSocket.onmessage = (msg) => this.handleMessage(msg);
      this.webSocket.onerror = (err) => this.handleError(err);
      this.webSocket.onclose = (_) => {
        if (this.status !== ConnectionStatus.ERROR) {
          this.setStatus(ConnectionStatus.UNAVAILABLE);
        }
        this.webSocket = undefined;
      };
    }

    setInterval(() => {
      if (this.webSocket && this.status !== ConnectionStatus.ERROR && this.status !== ConnectionStatus.UNAVAILABLE) {
        this.webSocket.send('');
      }
    }, Connection.HEARTBEAT_INTERVAL);
  }

  onHandshake() {
    // Intentionally empty
  }

  onReload() {
    // Intentionally empty
  }

  onConnectionError(_: string) {
    // Intentionally empty
  }

  onStatusChange(_: ConnectionStatus) {
    // Intentionally empty
  }

  onMessage(message: any) {
    // eslint-disable-next-line no-console
    console.error('Unknown message received from the live reload server:', message);
  }

  handleMessage(msg: any) {
    let json;
    try {
      json = JSON.parse(msg.data);
    } catch (e: any) {
      this.handleError(`[${e.name}: ${e.message}`);
      return;
    }
    if (json.command === 'hello') {
      this.setStatus(ConnectionStatus.ACTIVE);
      this.onHandshake();
    } else if (json.command === 'reload') {
      if (this.status === ConnectionStatus.ACTIVE) {
        this.onReload();
      }
    } else {
      this.onMessage(json);
    }
  }

  handleError(msg: any) {
    // eslint-disable-next-line no-console
    console.error(msg);
    this.setStatus(ConnectionStatus.ERROR);
    if (msg instanceof Event && this.webSocket) {
      this.onConnectionError(`Error in WebSocket connection to ${this.webSocket.url}`);
    } else {
      this.onConnectionError(msg);
    }
  }

  setActive(yes: boolean) {
    if (!yes && this.status === ConnectionStatus.ACTIVE) {
      this.setStatus(ConnectionStatus.INACTIVE);
    } else if (yes && this.status === ConnectionStatus.INACTIVE) {
      this.setStatus(ConnectionStatus.ACTIVE);
    }
  }

  setStatus(status: ConnectionStatus) {
    if (this.status !== status) {
      this.status = status;
      this.onStatusChange(status);
    }
  }

  private send(command: string, data: any) {
    const message = { command, data };
    this.webSocket!.send(JSON.stringify(message));
  }

  setFeature(featureId: string, enabled: boolean) {
    this.send('setFeature', { featureId, enabled });
  }
}
