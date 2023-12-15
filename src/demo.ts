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

import { Layout } from "./Layout";
import { Controller } from "./Controller";

const params = new Map<string, string>();
const matches = window.parent.location.href.match(/[?&]+([^&]+)/gi);
matches?.forEach((match, _index) => {
  const tokens = match.split("=");
  params.set(tokens[0].substring(1), tokens[1]);
});

const server = params.get("server") ?? "localhost";

const view1 = new SceneView({ container: "SceneView1", map: { basemap: "topo-3d", ground: "world-elevation" } });
view1.when(() => {
  view1.ui.components = [];
  const layout = new Layout("1", "0");
  new Controller(view1, server, layout);
});

const view2 = new SceneView({ container: "SceneView2", map: { basemap: "topo-3d", ground: "world-elevation" } });
view2.when(() => {
  view2.ui.components = [];
  const layout = new Layout("1", "1");
  new Controller(view2, server, layout);
});

const view3 = new SceneView({ container: "SceneView3", map: { basemap: "topo-3d", ground: "world-elevation" } });
view3.when(() => {
  view3.ui.components = [];
  const layout = new Layout("0", "0");
  new Controller(view3, server, layout);
});

const view4 = new SceneView({ container: "SceneView4", map: { basemap: "topo-3d", ground: "world-elevation" } });
view4.when(() => {
  view4.ui.components = [];
  const layout = new Layout("0", "1");
  new Controller(view4, server, layout);
});
