/* global define, Backbone, _ */
define([
		'dojo/text!../templates/LayoutViewTemplate.html',
		'esri/map'
],

function(viewTemplate, Map) {
	var LayoutView = Backbone.View.extend({

		initialize: function() {
			this.render();
		},

		render: function() {
			var template = _.template(viewTemplate);
			this.$el.html(template);

			return this;
		}

	});
	return LayoutView;
});