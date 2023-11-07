require([
  "esri/config",
  "esri/request",
  "esri/WebScene",
  "esri/layers/Layer",
  "esri/views/SceneView",
], function (
  config,
  esriRequest,
  WebScene,
  Layer,
  SceneView
) {
  // esriRequest = esriRequest.default || esriRequest;
  // WebScene = WebScene.default || WebScene;
  // SceneView = SceneView.default || SceneView;
  // config = config.default || config;

  var params = {};
  window.parent.location.href.replace(
    /[?&]+([^=&]+)=([^&]*)/gi,
    function (m, key, value) {
      params[key] = value;
    }
  );

  var portal = params["portal"];
  if (portal) {
    config.portalUrl = portal;
  }

  var sceneView = document.getElementById("SceneView");
  var view = new SceneView({ container: "SceneView", map: webscene })
  var url = params["url"];

  if (url) {
    view.map = new WebScene({ basemap: "topo", ground: "world-elevation" });
    Layer.fromArcGISServerUrl({ url: url }).then(function (layer) {
      view.map.layers.add(layer);
      layer
        .when(function () {
          return layer.queryExtent();
        })
        .then(function (response) {
          view.goTo(response.extent);
        });
    });
  } else {
    var webscene = params["webscene"] || "3fedc732d1be4af9b23ae2348f45ce7d";
    if (webscene.startsWith("http")) {
      esriRequest(webscene).then(function (json) {
        view.map = WebScene.fromJSON(json.data);
      });
    } else {
      view.map = new WebScene({ portalItem: { id: webscene, portal } });
    }
  }

  // The view must be ready (or resolved) before you can
  // access the properties of the WebScene
  view.when(function () {
    // view.basemapTerrain.renderPatchBorders = true;

    var slides = view.map.presentation.slides;
    var slidesDiv = document.getElementById("slides");

    function addSlide(slide, time) {
      var div = slidesDiv;
      if (!div) {
        return;
      }

      // Create a new <div> element for each slide and place the title of the slide in the element.
      var slideDiv = document.createElement("div");
      slideDiv.id = slide.id;
      slideDiv.classList.add("slide");

      if (time) {
        var textDiv = document.createElement("div");
        textDiv.innerHTML = time.toFixed(1) + "s";
        div.appendChild(textDiv);
      }

      // Create a new <img> element and place it inside the newly created <div>.
      // This will reference the thumbnail from the slide.
      var img = new Image();
      img.src = slide.thumbnail.url;
      img.title = slide.title.text;
      slideDiv.appendChild(img);
      div.appendChild(slideDiv);

      slideDiv.addEventListener("click", function () {
        slide.applyTo(view)
      });
    }

    slides.forEach(function (slide) {
      addSlide(slide);
    });

    view.pixelRatio = 2;
    // view.resourceController.memoryController.maxMemory = 1000;
    view.qualityProfile = "high";
  });
});
