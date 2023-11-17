import SceneView from "@arcgis/core/views/SceneView";

import { Layout } from "./Layout";
import { Controller } from "./Controller";

const params = new Map<string, string>();
const matches = window.parent.location.href.match(/[?&]+([^&]+)/gi);
matches?.forEach((match, _index) => {
  const tokens = match.split("=");
  params.set(tokens[0].substring(1), tokens[1]);
});

const view = new SceneView({ container: "SceneView", map: { basemap: "topo-3d", ground: "world-elevation" } });
const layout = new Layout(params.get("row"), params.get("column"));
const server = params.get("server") ?? "localhost";

// The view must be ready (or resolved) before you can access its properties
view.when(() => {
  view.ui.components = [];
  new Controller(view, server, layout);
});
