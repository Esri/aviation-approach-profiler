/* global define, Backbone, _ */
define([
		'app/config',
		'dojo/text!../templates/BasemapsViewTemplate.html',
	],

	function(config, viewTemplate) {
		var BasemapsView = Backbone.View.extend({

			tagName: 'ul',
			className: 'dropdown-menu basemaps-list',

			events: {
				'click li > a': 'basemapsListItem_ClickHandler'
			},

			initialize: function() {
				this.initialBasemap = config.basemaps.default;
				this.basemaps = config.basemaps.options;
				this.map = this.options.map;
				this.render();
			},

			render: function() {
				var template = _.template(viewTemplate, {
					basemaps: this.basemaps
				});
				this.$el.html(template);

				// Append Basemaps to its anchor
				this.options.anchor.append(this.$el);

				this.startup();
			},

			startup: function() {
				var basemaps,
					webmapBasemaps = this.options.basemap;

				// Remove webmap defined basemap to allow Basemaps to take control
				var removeLayerIds = _.map(webmapBasemaps.baseMapLayers, function(layer) {
					this.options.map.removeLayer(layer.layerObject);
					return layer.id;
				}, this);

				this.setBasemap(this.initialBasemap);
			},

			/**
			 * Event Handlers
			 */

			basemapsListItem_ClickHandler: function(e) {
				var srcElement = e.target || e.srcElement;
				this.setBasemap(srcElement.attributes['data-basemap'].value);
			},

			setBasemap: function(basemap) {
				this.map.setBasemap(basemap);
			}
		});
		return BasemapsView;
	});