/* global define, app:true, _ */
define([
		'app/config',

		'app/utils/LayerController',
		'app/utils/ParseWebmap',
		'app/utils/Query',

		'app/views/LayoutView',

		'components/Geocoder/views/GeocoderView',
		'components/Graph/views/GraphView',
		'components/Navbar/views/NavbarView',
		'components/oAuth/oAuth',
		'components/Profiler/views/ProfilerView',
		'components/RunwayProfile/views/runwayProfile',

		'dojo/_base/connect',
		'dojo/_base/lang',
		'dojo/on',
		'dojo/Deferred',
		'dojo/dom',
		'dojo/dom-style',
		'dojo/topic',

		'esri/arcgis/utils',
		'esri/config',
		'esri/tasks/GeometryService',
		'esri/urlUtils'
	],

	function(
		config,

		LayerControllerUtil, ParseWebmapUtil, QueryUtil,

		Layout, Geocoder, Graph, Navbar, oAuth, Profiler, RunwayProfile,

		connect, lang, on, Deferred, dom, domStyle, topic,

		arcgisUtils, esriConfig, GeometryService, urlUtils) {
		return {

			/**
			 * This is the entry point for the application, called from index.html
			 * @return { N/A }
			 */
			startup: function() {
				app = this;
				this.initConfig();
			},

			/**
			 * Initialize esri configuration settings
			 * @return { N/A }
			 */
			initConfig: function() {
				this.config = config;

				// Set Portal URL
				if (config.portalUrl) {
					arcgisUtils.arcgisUrl = config.portalUrl;
				}

				esriConfig.defaults.geometryService = new GeometryService(config.geometryService.url);
				esriConfig.defaults.io.proxyUrl = config.proxy.url;
				esriConfig.defaults.io.alwaysUseProxy = config.proxy.alwaysUseProxy;

				_.each(config.proxy.rules, lang.hitch(this, function(url) {
					urlUtils.addProxyRule({
						proxyUrl: config.proxy.url,
						urlPrefix: url
					});
				}));

				oAuth.createOAuthAccess(config.appId, config.AGOLOrgUrl).then(lang.hitch(this, function(){
					this.initLayout();
				}));
				
			},

			/**
			 * Initialize the application layout by inserting top level nodes into the DOM
			 * @return { N/A }
			 */
			initLayout: function() {
				this.layout = new Layout({
					el: $('body')
				});

				this.initMap();
			},

			/**
			 * Initialize the map and place it in 'mapContainer'
			 * @return { N/A }
			 */
			initMap: function() {
				arcgisUtils.createMap(config.webmap, 'mapContainer', {
					mapOptions: {
						slider: config.slider.slider,
						sliderOrientation: config.slider.sliderOrientation,
						sliderStyle: config.slider.sliderStyle
					}
				}).then(lang.hitch(this, function(response) {
					this.map = response.map;
					this.webmap = response;
					this.map.resize();
					this.setMapClickTools(response.clickEventHandle, response.clickEventListener);
					this.disablePopups();
					this.initWebmapParser(this.webmap);
					// Publish the initial extent for home button
					topic.publish('controller/initialExtent', this.map.extent);
				}));
			},
			setMapClickTools: function(handle, listener) {
				this.handle = handle;
				this.listener = listener;
			},
			disablePopups: function() {
				connect.disconnect(this.handle);
				if (this.profiler) {
					this.profiler.surfaceLayer.show();
				}
			},
			enablePopupsOnce: function() {
				// Change cursor to help cursor when identify is clicked
				domStyle.set('mapContainer_layers', 'cursor', 'help');
				if (this.profiler) {
					this.profiler.surfaceLayer.hide();
				}
				this.handle = on.once(this.map, 'click', this.listener);
				this.map.infoWindow.on('hide', lang.hitch(this, function() {
					if (this.profiler) {
						this.profiler.surfaceLayer.show();
					}
					// Restore cursor after popup is closed.
					domStyle.set('mapContainer_layers', 'cursor', 'default');
				}));
				
			},

			/**
			 * Parse the webmap to create some lookup objects to be used by the application
			 * @param  { Object } webmap Webmap object created by arcgis.utils.createMap()
			 * @return { N/A }
			 */
			initWebmapParser: function(webmap) {
				// Call ParseWebmap to create lookup of webmap layers
				var parser = new ParseWebmapUtil();
				parser.parse(webmap, lang.hitch(this, function(results) {
					this.layerLookup = results.lookup;
					this.basemap = results.basemap;
					this.initLayerController();
					this.initComponents();
				}));
			},

			/**
			 * Initialize LayerController utility class to manage map layers
			 * @return { N/A }
			 */
			initLayerController: function() {
				this.layerController = new LayerControllerUtil();
				this.layerController.startup(this.map, this.layerLookup);
			},

			/**
			 * Initialize components of the application, this is the last responsibility of the Controller
			 * @return { N/A }
			 */
			initComponents: function() {
				var map = this.map.container;

				this.navbar = new Navbar({
					el: this.layout.$el.find('.navbar-container'),
					map: this.map,
					layerLookup: this.layerLookup,
					layerController: this.layerController,
					basemap: this.basemap
				});

				// Geocoder Component
				this.geocoder = new Geocoder({
					anchor: map,
					map: this.map
				});

				// Profiler
				this.profiler = new Profiler({
					anchor: map,
					map: this.map,
					layerLookup: this.layerLookup,
					layerController: this.layerController,
					query: new QueryUtil()
				});

				// Graph
				this.graph = new Graph({
					el: this.layout.$el.find('.graph-container'),
					map: this.map
				});

				// Runway Profile
				this.runwayProfile = new RunwayProfile({
					map: this.map,
					profiler: this.profiler
				}, 'graphViewContainer');

			}
		};
	}
);