/* global define, _ */
define([
		'app/config',

		'dojo/_base/lang',
		'dojo/on',
		'dojo/query',
		'dojo/topic',

		'esri/geometry/webMercatorUtils',
	],

	function(
		config,
		lang, on, query, topic,
		webMercatorUtils
	) {
		return function LayerController() {

			this.startup = function(map, layerLookup) {
				// Variables
				this.map = map;
				this.layerLookup = layerLookup;
				this.currentZoomLevel = this.map.getZoom();
			};

			this.hideAllLayers = function() {
				_.each(this.layerLookup, lang.hitch(this, function(layer) {
					layer.layerObject.setVisibility(false);
				}));
				this.toggleGraphicsLayers(false);
			};

			// hide an array of layers
			this.hideLayers = function(layers) {
				_.each(layers, function(layer) {
					if (typeof layer !== 'undefined') {
						layer.layerObject.setVisibility(false);
					}
				}, this);
			};

			// show an array of layers
			this.showLayers = function(layers) {
				_.each(layers, function(layer) {
					if (typeof layer !== 'undefined') {
						layer.layerObject.setVisibility(true);
					}
				}, this);

				// UNCOMMENT IF LAYERS SHOULD BE ALL ON WITH MODEL CHANGE
				// 
				// checkboxes = query('input[type=checkbox]');
				// _.each(checkboxes, function(checkbox){
				// 	checkbox.checked = true;
				// });

			};

			this.toggleGraphicsLayers = function(visible) {
				_.each(this.graphicsLayers, lang.hitch(this, function(layer) {
					this.map.getLayer(layer).setVisibility(visible);
				}));
			};

			this.getLayerCollection = function() {
				return this.layerLookup;
			};

			this.toggleVisibility = function(layerId, isVisible) {
				var layer = this.getLayerById(layerId);
				if (layer !== null) {
					layer.layerObject.setVisibility(isVisible);
				}
			};

			this.getLayerById = function(layerId) {
				var layers = _.find(this.layerLookup, function(layer) {
					return layer.id === layerId;
				});
				return (layers[0] !== null) ? layers[0] : null;
			};

			this.addLayerToMap = function(layer, layerName, extent) {
				on.once(this.map, 'layer-add-result', lang.hitch(this, function(layer) {

					if (layer.error) {
						// There was an error with the map service, notify user and stop processing
						window.alert('There was an error with the layer\'s data source, it is unavailable at this time.');
					} else {
						var lyrExtent = extent;

						if (!layer.layer.name) {
							layer.layer.name = layerName;
						}

						if (!extent) {
							lyrExtent = webMercatorUtils.geographicToWebMercator(layer.layer.fullExtent);
						}

						topic.publish('LayerList/add-user-layer', null, layer.layer, null, true);
						this.map.setExtent(lyrExtent.expand(1.25), true);
					}
				}));

				this.map.addLayer(layer, 99);
			};
		};
	});