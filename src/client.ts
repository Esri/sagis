import SceneView from "@arcgis/core/views/SceneView";

import { Layout } from "./Layout";
import { Controller } from "./Controller";

const params = new Map<string, string>();

const matches = window.parent.location.href.match(/[?&]+([^=&]+)=([^&]*)/gi);
matches?.forEach((_match, _index, matches) => params.set(matches[0], matches[1]));

const view = new SceneView({ container: "SceneView" });
const layout = new Layout(params.get("row"), params.get("column"));
const server = params.get("server") ?? "localhost";

// The view must be ready (or resolved) before you can access the properties of the WebScene
view.when(() => {
  new Controller(view, server, layout);
});
