/* global define, Backbone, _, getAppPath */
define([
		'app/config',

		'dojo/_base/lang',
		'dojo/text!../templates/GraphViewTemplate.html',
		'dojo/topic'
	],

	function(
		config,
		
		lang, viewTemplate, topic) {
		var GraphView = Backbone.View.extend({

			events: {
				'click .hide-graph': 'close_ClickHandler'
			},

			initialize: function() {
				this.map = this.options.map;
				this.render();
			},

			render: function() {
				var template = _.template(viewTemplate)();
				this.$el.html(template);

				this.startup();
			},

			startup: function() {

				topic.subscribe('Graph/show', lang.hitch(this, function() {
					this.show();
				}));

			},

			close_ClickHandler: function(e) {
				this.hide();
				if (app) {if (app.runwayProfile) {app.runwayProfile.destroyChart();}}
			},

			show: function() {
				var mapNode = $(this.map.container);
				mapNode.bind('otransitionend transitionend webkitTransitionEnd', lang.hitch(this, function() {
					this.map.resize();
				}));

				mapNode.css('bottom', '300px');
			},

			hide: function() {
				var mapNode = $(this.map.container);
				mapNode.bind('otransitionend transitionend webkitTransitionEnd', lang.hitch(this, function() {
					this.map.resize();
				}));

				mapNode.css('bottom', '0');
			}

		});
		return GraphView;
	});