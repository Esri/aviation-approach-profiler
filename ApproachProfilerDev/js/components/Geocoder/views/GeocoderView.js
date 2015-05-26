/* global define, Backbone, _, getAppPath */
define([
		'app/config',

		'dojo/_base/fx',
		'dojo/_base/lang',
		'dojo/dom',
		'dojo/dom-class',
		'dojo/on',
		'dojo/text!../templates/GeocoderViewTemplate.html',
		
		'esri/dijit/Geocoder',
		'esri/Color',
		'esri/graphic',
		'esri/InfoTemplate',
		'esri/layers/GraphicsLayer',
		'esri/symbols/PictureMarkerSymbol',
		'esri/symbols/SimpleMarkerSymbol'
	],

	function(
		config,

		fx, lang, dom, domClass, on, viewTemplate,

		Geocoder, Color, Graphic, InfoTemplate, GraphicsLayer, PMS, SMS) {
		var GeocoderView = Backbone.View.extend({

			events: {
				'keypress #esriGeocoder_input': 'esriGeocoder_KeypressHandler'
			},

			initialize: function() {
				this.render();
			},

			render: function() {
				var template = _.template(viewTemplate)();
				this.$el.html(template);

				// Append Geocoder to its anchor
				$(this.options.anchor).append(this.$el);

				this.startup();
			},

			startup: function() {
				var geocodeResultsLayer;

				this.geocoder = new Geocoder({
					autoNavigate: config.geocoder.autoNavigate,
					autoComplete: config.geocoder.autoComplete,
					highlightLocation: config.geocoder.highlightLocation,
					symbol: new SMS (config.geocoder.highlightLocationSymbol),
					arcgisGeocoder: {
						url: config.geocoder.url,
						sourceCountry: config.geocoder.sourceCountry,
						placeholder: config.geocoder.placeholderText,
						outFields: config.geocoder.outFields,
						categories: config.geocoder.categories,
						localSearchOptions: {
							minScale: config.geocoder.localSearchOptions.minScale,
							distance: config.geocoder.localSearchOptions.distance
						}
					},
					map: this.options.map
				}, 'esriGeocoder');

				if (config.slider.sliderOrientation === 'vertical'){
					domClass.add('esriGeocoder', 'simpleGeocoder_VerticalSlider');
				} else if (config.slider.sliderStyle === 'large'){
					domClass.add('esriGeocoder', 'simpleGeocoder_LargeHorizontalSlider');
				}
				
				this.geocoder.startup();
			},

			esriGeocoder_KeypressHandler: function(e) {
				if (e.keyCode === 13) {
					e.preventDefault();
				}
			}

		});
		return GeocoderView;
	});