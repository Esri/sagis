import SceneView from "@arcgis/core/views/SceneView";
import WebScene from "@arcgis/core/WebScene";
import Slide from "@arcgis/core/webscene/Slide";
import Layer from "@arcgis/core/layers/Layer";
import esriRequest from "@arcgis/core/request";
// import config from "@arcgis/config";

let params = new Map<string, string>();
const matches = window.parent.location.href.match(/[?&]+([^=&]+)=([^&]*)/gi);

matches?.forEach((_match, _index, matches) => params.set(matches[0], matches[1]));

let portal = params.get("portal");
if (portal) {
  // config.portalUrl = portal;
}

// let sceneView = document.getElementById("SceneView");
let view = new SceneView({ container: "SceneView" });

let url = params.get("url");

if (url) {
  view.map = new WebScene({ basemap: "topo", ground: "world-elevation" });
  Layer.fromArcGISServerUrl({ url: url }).then(function (layer) {
    view.map.layers.add(layer);
    layer.when(function () {
      view.goTo(layer.fullExtent);
    });
  });
} else {
  let webscene = params.get("webscene") ?? "3fedc732d1be4af9b23ae2348f45ce7d";
  if (webscene.startsWith("http")) {
    esriRequest(webscene).then(function (json) {
      view.map = WebScene.fromJSON(json.data);
    });
  } else {
    view.map = new WebScene({ portalItem: { id: webscene, portal: portal as any } });
  }
}

// The view must be ready (or resolved) before you can access the properties of the WebScene
view.when(function () {
  const webScene = view.map as WebScene;
  // view.basemapTerrain.renderPatchBorders = true;

  let slides = webScene.presentation.slides;
  let slidesDiv = document.getElementById("slides");

  function addSlide(slide: Slide) {
    let div = slidesDiv;
    if (!div) {
      return;
    }

    // Create a new <div> element for each slide and place the title of the slide in the element.
    let slideDiv = document.createElement("div");
    slideDiv.id = slide.id;
    slideDiv.classList.add("slide");

    // Create a new <img> element and place it inside the newly created <div>.
    // This will reference the thumbnail from the slide.
    let img = new Image();
    img.src = slide.thumbnail.url ?? "";
    img.title = slide.title.text ?? "";
    slideDiv.appendChild(img);
    div.appendChild(slideDiv);

    slideDiv.addEventListener("click", function () {
      slide.applyTo(view);
    });
  }

  slides.forEach(function (slide) {
    addSlide(slide);
  });
});
