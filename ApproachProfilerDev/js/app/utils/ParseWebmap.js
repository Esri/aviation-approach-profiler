/* global define, c:true, _ */
define([],

	function() {
		return function Parse() {

			/**
			 * Initializer method to control the parsing of the web map
			 * @param  { Object }   webmap   Web map object
			 * @param  { Function } callback Callback function to invoke when parsing is complete
			 * @return { Object }            layers object with various lookup objects
			 */
			this.parse = function(webmap, callback) {

				var operationalLayers = webmap.itemInfo.itemData.operationalLayers;

				// Create a lookup object
				var lookup = this._getLookup(operationalLayers);

				var layers = {
					lookup: lookup,
					basemap: webmap.itemInfo.itemData.baseMap
				};

				// Invoke callback once finished, pass some data
				callback(layers);
			};

			/**
			 * Create a dictionary object for looking up map layer names by webmap title
			 * @param  { Object} operationalLayers Operational Layers in Webmap
			 * @return { Object }                   Lookup object
			 */
			this._getLookup = function(operationalLayers) {
				// Create a dictionary to relate map layer names to webmap titles
				var _lookup = {};

				_.each(operationalLayers, function(layer) {
					_lookup[layer.title] = {
						id: layer.id,
						url: layer.url,
						layerObject: layer.layerObject,
						visibleLayers: layer.visibleLayers
					};
				});

				return _lookup;

			};
		};
	});