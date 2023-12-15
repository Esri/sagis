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
import WebScene from "@arcgis/core/WebScene";
import Slide from "@arcgis/core/webscene/Slide";
import Layer from "@arcgis/core/layers/Layer";
import esriRequest from "@arcgis/core/request";
import config from "@arcgis/core/config";

import { Controller } from "./Controller";

const params = new Map<string, string>();

const matches = window.parent.location.href.match(/[?&]+([^&]+)/gi);
matches?.forEach((match, _index) => {
  const tokens = match.split("=");
  params.set(tokens[0].substring(1), tokens[1]);
});

const portal = params.get("portal");
if (portal) {
  config.portalUrl = portal;
}

const view = new SceneView({ container: "SceneView" });

const url = params.get("url");
const webscene = params.get("webscene");
if (url) {
  view.map = new WebScene({ basemap: "topo-3d", ground: "world-elevation" });
  Layer.fromArcGISServerUrl({ url: url }).then(function (layer) {
    view.map.layers.add(layer);
    layer.when(() => view.goTo(layer.fullExtent));
  });
} else if (webscene) {
  if (webscene.startsWith("http")) {
    esriRequest(webscene).then((json) => (view.map = WebScene.fromJSON(json.data)));
  } else {
    view.map = new WebScene({ portalItem: { id: webscene } });
  }
} else {
  view.map = new WebScene({ basemap: "topo-3d", ground: "world-elevation" });
}

// The view must be ready (or resolved) before you can access the properties of the WebScene
view.when(function () {
  const server = params.get("server") ?? "localhost";
  new Controller(view, server);

  const webScene = view.map as WebScene;
  // view.basemapTerrain.renderPatchBorders = true;

  const slides = webScene.presentation.slides;
  const slidesDiv = document.getElementById("slides");

  function addSlide(slide: Slide) {
    const div = slidesDiv;
    if (!div) {
      return;
    }

    // Create a new <div> element for each slide and place the title of the slide in the element.
    const slideDiv = document.createElement("div");
    slideDiv.id = slide.id;
    slideDiv.classList.add("slide");

    // Create a new <img> element and place it inside the newly created <div>.
    // This will reference the thumbnail from the slide.
    const img = new Image();
    img.src = slide.thumbnail.url ?? "";
    img.title = slide.title.text ?? "";
    slideDiv.appendChild(img);
    div.appendChild(slideDiv);

    slideDiv.addEventListener("click", function () {
      slide.applyTo(view, { speedFactor: 0.3 });
    });
  }

  slides.forEach(function (slide) {
    addSlide(slide);
  });
});
