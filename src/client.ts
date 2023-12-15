/* Copyright 2023 Esri
 *
 * Licensed under the Apache License Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import SceneView from "@arcgis/core/views/SceneView";
import Fullscreen from "@arcgis/core/widgets/Fullscreen";

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
  view.ui.add(new Fullscreen({ view }), "top-right");
  new Controller(view, server, layout);
});
