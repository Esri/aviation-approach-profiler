/* global define, Backbone, _, numeral, esri */
define([
		'dojo/text!../templates/LegendViewTemplate.html',

		'esri/dijit/Legend'
	],

	function(
		viewTemplate,

		Legend) {
		var LegendView = Backbone.View.extend({

			events: {},

			initialize: function() {
				this.layerList = null;
				this.render();
			},

			render: function(init) {
				var template = _.template(viewTemplate);
				this.$el.html(template);

				// Append Legend to its anchor
				this.options.anchor.append(this.$el);

				this.startup();

				return this;
			},

			startup: function() {
				// Override 'No Legend' text
				// esri.bundle.widgets.legend.NLS_noLegend = 'No visible layers to display.';

				this.layerList = this.getLayerList();

				this.legend = new Legend({
					layerInfos: this.layerList,
					map: this.options.map
				}, 'esriLegend');
				this.legend.startup();
			},

			/**
			 * Private Methods
			 */

			/**
			 * Get a list of layerInfos compatible with the Legend
			 * @return { Array } List of LayerInfos
			 */
			getLayerList: function() {
				var lookup = this.options.layerLookup,
					layers = [];

				// Build a list of layers to display in the legend
				_.each(lookup, function(layer) {
					layers.push({
						layer: layer.layerObject,
						title: layer.group
					});

				});

				return layers;
			}
		});
		return LegendView;
	});