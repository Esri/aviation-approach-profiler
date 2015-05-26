/* global define, Backbone, _, getAppPath */
define([
		'app/config',

		'components/Basemaps/views/BasemapsView',
		'components/LayerList/views/LayerListView',
		'components/Legend/views/LegendView',
		'components/oAuth/oAuth',

		'dojo/dom-style',
		'dojo/_base/lang',
		'dojo/query',
		'dojo/text!../templates/NavbarViewTemplate.html',
		'dojo/topic',

		'esri/geometry/Extent',
		'esri/map'
	],

	function(
		config,

		Basemaps, LayerList, Legend, oAuth,

		domStyle, lang, query, viewTemplate, topic,

		Extent, map) {
		var Navbar = Backbone.View.extend({

			events: {},

			initialize: function() {
				this.render();
			},

			render: function() {

				var template = _.template(viewTemplate);
				var options = {
					title: config.applicationTitle
				};
				this.$el.html(template(options));

				this.configCustomColors();
				this.startup();
			},

			startup: function() {
				this.initComponents();
			},

			initComponents: function() {
				// Basemaps
				this.basemaps = new Basemaps({
					anchor: this.$el.find('.basemaps-dropdown'),
					map: this.options.map,
					basemap: this.options.basemap
				});

				// Legend
				this.legend = new Legend({
					anchor: this.$el.find('.legend-container'),
					layerLookup: this.options.layerLookup,
					map: this.options.map
				});

				// Layer List
				this.layerList = new LayerList({
					anchor: this.$el.find('.layers-container'),
					map: this.options.map,
					layerLookup: this.options.layerLookup,
					layerController: this.options.layerController
				});

				// Home
				var initialExtent;
				topic.subscribe('controller/initialExtent', lang.hitch(this, function(extent) {
					initialExtent = new Extent(extent);
				}));
				this.button_home = this.$el.find('.button-home');
				this.button_home.on('click', function() {
					app.map.centerAt(initialExtent.getCenter());
				});

				// Identify
				this.button_identify = this.$el.find('.button-identify');
				this.button_identify.on('click', function() {
					app.enablePopupsOnce();
				});

				// Sign out
				this.button_signOut = this.$el.find('.button-signOut');
				this.button_signOut.on('click', function() {
					oAuth.signOut();
				});
			},

			configCustomColors: function() {
				var titleBarColor = config.applicationNavBarColor;
				var navBar = query('.navbar-inverse')[0];
				domStyle.set(navBar, {
					backgroundColor: titleBarColor,
					borderColor: config.applicationNavBarBorder.color,
					borderStyle: config.applicationNavBarBorder.style,
					borderWidth: config.applicationNavBarBorder.width,
					borderRadius: 0
				});

				var titleText = query('.navbar-brand')[0];
				domStyle.set(titleText, {
					color: config.applicationNavBarTextColor
				});

				var dropdownText = query('.dropdown-toggle');
				_.each(dropdownText, function(el) {
					domStyle.set(el, {
						color: config.applicationNavBarTextColor
					});
				});

				var homeButton = query('.button-home')[0];
				domStyle.set(homeButton, {
					color: config.applicationNavBarTextColor
				});

				var identifyButton = query('.button-identify')[0];
				domStyle.set(identifyButton, {
					color: config.applicationNavBarTextColor
				});

				var signOutButton = query('.button-signOut')[0];
				domStyle.set(signOutButton, {
					color: config.applicationNavBarTextColor
				});
			}
		});
		return Navbar;
	});