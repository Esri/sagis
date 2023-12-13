import Basemap from "@arcgis/core/Basemap";
import CameraLayout from "@arcgis/core/CameraLayout";
import Ground from "@arcgis/core/Ground";
import Viewpoint from "@arcgis/core/Viewpoint";
import WebScene from "@arcgis/core/WebScene";
import Collection from "@arcgis/core/core/Collection";
import Layer from "@arcgis/core/layers/Layer";
import SceneView from "@arcgis/core/views/SceneView";
import { watch, whenOnce } from "@arcgis/core/core/reactiveUtils";
import Handles from "@arcgis/core/core/Handles";
import { Layout } from "./Layout";

/**
 * Interface to or from a distributed viewing session.
 *
 * The controller on the viewer sends messages to the server, which re-broadcasts this message to all clients. Only
 * a special tile message is interpreted by the server, which keeps the global display wall layout state.
 *
 * Messages are one character for the message type, followed by the message payload. The payload is typically the state
 * in JSON. The viewer and client side deserialization and serialization must match for correct operation.
 */
export class Controller {
  constructor(
    private readonly _view: SceneView,
    server: string,
    layout: Layout | null = null
  ) {
    this._socket = new WebSocket(`wss://${server}:42001/`);
    this._socket.onerror = (event: ErrorEvent) => console.log(`Sagis server error: ${event.message}.`);

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
    const broadcastValue = (type: string, value: any, context?: any): void => {
      if (value != null && this._socket.readyState === WebSocket.OPEN) {
        try {
          if (typeof value === "object" && "toJSON" in value) {
            value = value.toJSON(context);
          }
          const message = typeof value === "string" ? value : JSON.stringify(value);
          this._socket.send(`${type}${message}`);
        } catch (e: any) {
          console.log(`Error serializing '${type}': ${e.message}`);
        }
      }
    };

    const watchLayers = (layers: Array<Layer> | Collection<Layer>): void =>
      layers.forEach((layer) =>
        this._handles.add(
          watch(
            () => layer.visible,
            (visible) => broadcastValue("l", `${layer.id} ${visible}`)
          ),
          layer.id
        )
      );

    this._handles.add([
      watch(
        () => this._view.environment.lighting,
        () => broadcastValue("L", this._view.environment.lighting),
        initial
      ),
      watch(
        () => this._view.environment.weather,
        () => broadcastValue("C", this._view.environment.weather),
        initial
      ),
      watch(
        () => this._view.viewpoint,
        (viewpoint) => broadcastValue("V", viewpoint),
        initial
      ),
      watch(
        () => this._view.qualityProfile,
        (mode) => broadcastValue("Q", mode),
        initial
      ),
      watch(
        () => this._view.map,
        (map: WebScene) => map.loadAll().then(() => broadcastValue("W", map)),
        initial
      ),
      watch(
        () => this._view.map.basemap,
        (basemap) => basemap.loadAll().then(() => broadcastValue("B", basemap)),
        initial
      ),
      watch(
        () => this._view.map.ground,
        (ground) => ground.loadAll().then(() => broadcastValue("G", ground)),
        initial
      ),
      this._view.map.allLayers.on("change", (event) => {
        this._handles.remove(event.removed.map((layer) => layer.id));
        watchLayers(event.added);
      })
    ]);

    watchLayers(this._view.map.allLayers);
  }

  private _initClient(layout: Layout): void {
    const cameraLayout = new CameraLayout();
    cameraLayout.row = layout.row;
    cameraLayout.column = layout.column;

    this._socket.onopen = () =>
      // Registering as a client will push global state, wait for not updating st all initial state is set
      whenOnce(() => !this._view.updating).then(() => {
        const camera = this._view.camera;
        camera.layout = cameraLayout.clone();
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
        case "V": {
          const viewpoint = Viewpoint.fromJSON(json);
          viewpoint.camera.layout = cameraLayout.clone();
          this._view.viewpoint = viewpoint;
          break;
        }

        case "L":
          this._view.environment.lighting = json;
          break;

        case "Q":
          this._view.qualityProfile = message as "low" | "medium" | "high";
          break;

        case "W": {
          WebScene.fromJSON(json)
            .load()
            .then((map: WebScene) => (this._view.map = map));
          break;
        }

        case "C":
          this._view.environment.weather = json;
          break;

        case "B": {
          Basemap.fromJSON(json)
            .load()
            .then((basemap: Basemap) => (this._view.map.basemap = basemap));
          break;
        }

        case "G":
          this._view.map.ground = Ground.fromJSON(json);
          break;

        case "T": {
          const tile = message.split(",");
          cameraLayout.rows = parseFloat(tile[0]);
          cameraLayout.columns = parseFloat(tile[1]);

          const camera = this._view.camera;
          camera.layout = cameraLayout.clone();
          this._view.camera = camera;
          break;
        }

        case "l": {
          const [id, visible] = message.split(" ");
          const layer = this._view.map.allLayers.find((layer) => layer.id === id);
          if (layer) {
            layer.visible = visible === "true";
          }
          break;
        }

        default:
          console.error(`Missing deserialization for type '${type}'`);
      }
    };
  }

  private readonly _handles = new Handles();
  private readonly _socket: WebSocket;
}
