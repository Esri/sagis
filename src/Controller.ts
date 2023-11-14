import Viewpoint from "@arcgis/core/Viewpoint";
import SceneView from "@arcgis/core/views/SceneView";
import { watch, whenOnce } from "@arcgis/core/core/reactiveUtils";
import Handles from "@arcgis/core/core/Handles";
import { Layout } from "./Layout";

/** Interface to or from a distributed viewing session */
export class Controller {
  constructor(
    private readonly _view: SceneView,
    server: string,
    layout: Layout | null = null
  ) {
    this._socket = new WebSocket(`wss://${server}:8080/`);
    this._socket.onerror = (event) => console.log(`Sagis server error: ${event}`);

    if (layout) {
      this._initClient(layout);
    } else {
      this._socket.onopen = () => this._initViewer();
    }
  }

  destroy(): void {
    this._handles.destroy();
  }

  private _initViewer(): void {
    const initial = { initial: true };
    const broadcastValue = (type: string, value: any): void => {
      if (value != null && this._socket.readyState === WebSocket.OPEN) {
        if (typeof value === "object" && "toJSON" in value) {
          value = value.toJSON();
        }
        const message = typeof value === "string" ? value : JSON.stringify(value);
        this._socket.send(`${type}${message}`);
      }
    };

    this._handles.add([
      watch(
        () => this._view.viewpoint,
        (viewpoint) => broadcastValue("V", viewpoint),
        initial
      )
    ]);
  }

  private _initClient(layout: Layout): void {
    this._socket.onopen = () =>
      // Registering as a client will push global state, wait for not updating st all initial state is set
      whenOnce(() => !this._view.updating).then(() => {
        const camera = this._view.camera;
        (camera as any).layout.row = layout.row;
        (camera as any).layout.column = layout.column;
        this._view.camera = camera;

        this._socket.send(`T${layout.row},${layout.column}`);
      });

    this._socket.onmessage = (event) => {
      const data = event.data as string;
      const type = data[0];
      const message = data.substring(1);
      let json: any = {};
      try {
        json = JSON.parse(message);
      } catch (e) {}

      switch (type) {
        case "V":
          this._view.viewpoint = Viewpoint.fromJSON(json);
          break;

        case "T": {
          const camera = this._view.camera;
          const tile = message.split(",");

          (camera as any).layout.rows = parseFloat(tile[0]);
          (camera as any).layout.columns = parseFloat(tile[1]);
          this._view.camera = camera;
          break;
        }
      }
    };
  }

  private readonly _handles = new Handles();
  private readonly _socket: WebSocket;
}
