/* global define, Backbone, _ */
define([
		'app/config',

		'dojo/_base/lang',
		'dojo/dom',
		'dojo/text!../templates/LayerListViewTemplate.html',
		'dojo/topic'
	],

	function(
		config,
		lang, dom, viewTemplate, topic) {
		var LayerList = Backbone.View.extend({

			events: {
				'change .models-radios input': 'modelRadio_UpdatedHandler',
				'change .layers-checkboxes input': 'layerCheckbox_UpdateHandler'
			},

			initialize: function() {
				this.layerController = this.options.layerController;
				this.map = this.options.map;

				this.layers = null;
				this.selectedModel = config.layerList.models[config.defaultModel];
				this.selectedLayers = [];

				this.render();
				this.startup();
			},

			render: function() {
				var template = _.template(viewTemplate, config.layerList);
				this.$el.html(template);

				this.options.anchor.append(this.$el);

				return this;
			},

			startup: function() {

				var modelLayers = [];

				_.each(config.layerList.models, function(model) {
					_.each(model.layers, function(layer) {
						modelLayers.push(layer.name);
					}, this);
				}, this);

				this.layers = this.getAllLayersByName(modelLayers);
				var selectedModel = config.layerList.models[config.defaultModel];

				// Set up layer checkboxes for initial view.
				_.each(selectedModel.layers, function(layer) {
					var layerObj = app.layerLookup[layer.name];
					if (!layerObj.layerObject.visible){
						switch (layer.name) {
							case selectedModel.layers.heatmap.name:
								dom.byId('heatmap_check').checked = false;
								break;

							case selectedModel.layers.obstruction.name:
								dom.byId('obstructions_check').checked = false;
								break;

							case selectedModel.layers.contours.name:
								dom.byId('contours_check').checked = false;
								break;

							case selectedModel.layers.elevBand.name:
								dom.byId('elevBand_check').checked = false;
								break;

							default:
								break;
						}
					}
				});

				// this.selectedLayers = ['obstruction', 'heatmap', 'footprint'];
				this.selectedLayers = ['obstruction', 'heatmap', 'footprint', 'contours', 'elevBand'];
				this.updateSelectedModel(this.selectedModel);

				topic.subscribe('LayerList/get-selected-model', lang.hitch(this, function(callback) {
					callback(this.selectedModel);
				}));
				$('ul.dropdown-menu').on('click', '[data-stopPropagation]', function(e) {
					e.stopPropagation();
				});
			},

			/**
			 * Event Handlers
			 */

			modelRadio_UpdatedHandler: function(e) {
				var model = e.currentTarget.value;
				this.selectedModel = config.layerList.models[model];
				this.updateSelectedModel(this.selectedModel);
				this.setVisibleLayers();
			},

			layerCheckbox_UpdateHandler: function(e) {
				var checked = e.currentTarget.checked,
					value = e.currentTarget.value;

				if (checked) {
					this.selectedLayers.push(value);
				} else {
					this.selectedLayers = _.without(this.selectedLayers, value);
				}

				this.toggleLayer(value, checked);
			},

			/**
			 * Public Methods
			 */

			updateSelectedModel: function() {
				topic.publish('LayerList/update-selected-model', this.selectedModel);
			},

			/**
			 * Private Methods
			 */

			getAllLayersByName: function(layers) {
				var layerObjects = [];

				_.each(layers, function(layer) {
					layerObjects.push(this.options.layerLookup[layer]);
				}, this);

				return layerObjects;
			},

			getLayerByModel: function(model) {
				var layerObjects = [];

				_.each(this.selectedLayers, function(layer) {
					var layerName = model.layers[layer].name;
					layerObjects.push(this.options.layerLookup[layerName]);
				}, this);

				return layerObjects;
			},

			getLayerByName: function(name) {
				var layerName = this.selectedModel.layers[name].name;
				return this.options.layerLookup[layerName].layerObject;
			},

			toggleLayer: function(layer, show) {
				var layerObject = this.getLayerByName(layer);
				layerObject.setVisibility(show);
			},

			setVisibleLayers: function() {
				var selectedModel,
					selectedLayers;

				// hide layers				
				this.layerController.hideLayers(this.layers);
				// hide popups
				this.map.infoWindow.hide();
				// show layers
				this.layerController.showLayers(this.getLayerByModel(this.selectedModel));
			}

		});
		return LayerList;
	});