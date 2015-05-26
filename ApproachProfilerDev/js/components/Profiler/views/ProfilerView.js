/* global define, Backbone, _ */
define([
		'dojo/_base/lang',
		'dojo/on',
		'dojo/query',
		'dojo/text!../templates/ProfilerViewTemplate.html',
		'dojo/topic',

		'esri/Color',
		'esri/layers/FeatureLayer',
		'esri/symbols/SimpleLineSymbol',
		
	],

	function(
		lang, on, query, viewTemplate, topic,

		Color, FeatureLayer, SLS) {
		var Profiler = Backbone.View.extend({

			events: {
				'click .handle': 'handle_ClickHandler',
			},

			initialize: function() {
				this.map = this.options.map;
				this.layerLookup = this.options.layerLookup;
				this.layerController = this.options.layerController;
				this.Query = this.options.query;
				this.expanded = false;
				this.selectedModel = null;

				this.render();
				this.startup();
			},

			render: function() {
				var template = _.template(viewTemplate)();
				this.$el.html(template);

				$(this.options.anchor).append(this.$el);

				return this;
			},

			startup: function() {
				topic.subscribe('LayerList/update-selected-model', lang.hitch(this, this.modelChanged));

				topic.publish('LayerList/get-selected-model', lang.hitch(this, function(model) {
					this.setModel(model);
				}));

			},

			/**
			 * Event Handlers
			 */

			handle_ClickHandler: function(e) {
				if (!this.expanded) {
					this.getSurfaceLayer();
					this.expand();
				} else {
					this.collapse();
					this.removeSurfaceLayer();
				}
			},

			surfaceLayer_ClickHandler: function(e) {
				var modelName = query('input[type=radio]:checked')[0].value;
				var model = app.config.layerList.models[modelName];

				e.stopPropagation();
				this._selectedSurface = e.graphic;
				this.getObstructions(e.graphic.attributes[model.runwayKeyField]);

				// Publish the obstruction feature ID so runwayProfile.js can initChart
				topic.publish('ProfilerView/obstructionFeatureID', e.graphic.attributes[model.runwayKeyField]);

			},

			/**
			 * Private Methods
			 */

			modelChanged: function(model) {
				this.hide();
				if (app) {if (app.runwayProfile) {app.runwayProfile.destroyChart();}}
				this.collapse();
				this.removeSurfaceLayer();
				this.setModel(model);
			},

			hide: function() {

				var mapNode = $(app.map.container);
				mapNode.bind('otransitionend transitionend webkitTransitionEnd', lang.hitch(this, function() {
					this.map.resize();
				}));

				mapNode.css('bottom', '0');
			},

			setModel: function(model) {
				this.selectedModel = model;
				this.getSurfaceLayer(model.name);
			},

			getSurfaceLayer: function(modelName) {
				var model = app.config.layerList.models[modelName];
				var url = app.layerLookup[model.layers.footprint.name].url;
				var layer;

				layer = new FeatureLayer(url, {
					id: 'surfaceLayer',
					outFields: [model.runwayKeyField],
					className: 'surface-layer'
				});

				this.addClickListenerToLayer(layer, this.surfaceLayer_ClickHandler);
				this.addSurfaceLayer(layer);
			},

			addSurfaceLayer: function(layer) {
				this.surfaceLayer = layer;
				this.map.addLayer(layer);
			},

			removeSurfaceLayer: function() {
				if (this.surfaceLayer) {
					this.map.removeLayer(this.surfaceLayer);
					delete this.surfaceLayer;
				}
			},

			addClickListenerToLayer: function(layer, handler) {
				on(layer, 'click', lang.hitch(this, handler));
			},

			getObstructions: function(id) {
				topic.publish('Graph/show');
				app.runwayProfile.initChart(id);
				
			},

			/**
			 * UI Methods
			 */

			expand: function() {
				var handle = this.$el.find('.handle'),
					content = this.$el.find('.content'),
					container = this.$el.find('.profiler-container');

				container.bind('msTransitionEnd  oTransitionEnd transitionend webkitTransitionEnd', lang.hitch(this, function() {
					content.show();
					this.expanded = true;
					container.unbind('msTransitionEnd otransitionend transitionend webkitTransitionEnd');
				}));

				container.addClass('open');

			},

			collapse: function() {
				var handle = this.$el.find('.handle'),
					content = this.$el.find('.content'),
					container = this.$el.find('.profiler-container');

				content.hide();
				container.removeClass('open');
				this.expanded = false;

			}
		});
		return Profiler;
	});