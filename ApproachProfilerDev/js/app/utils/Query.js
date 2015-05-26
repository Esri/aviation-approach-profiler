/* global define, _ */
define([
		'esri/tasks/query',
		'esri/tasks/QueryTask',
		'esri/tasks/StatisticDefinition'
	],

	function(
		EsriQuery, QueryTask, StatDef) {
		return function Query() {

			/**
			 * Public method to perform a query against AGS
			 * @param  { Object }   options  Query Options object which stores all the parameters sent to AGS
			 * @param  { Function } callback Callback function to fire once the query returns
			 * @return { FeatureSet } FeatureSet object returned by AGS
			 */
			this.get = function(options, callback) {
				var _query = this._buildQuery(options);
				this._executeQuery(_query, options.url, callback);
			};

			/**
			 * Private method to build the query object
			 * @param  { Object} options Query Options object which stores all the parameters sent to AGS
			 * @return { Object } Esri JSAPI Query object to be used in the QueryTask
			 */
			this._buildQuery = function(options) {
				// queryInfo
				// .where	(default: 1=1)
				// .returnGeom	(default: false)
				// .fields	(default: ['*'])
				// .outStats	( array of objects with properties: type, field, name)

				var where,
					inputGeom,
					returnGeom,
					fields,
					outStats,
					query;

				// Required
				where = options.where || '1=1';
				inputGeom = options.inputGeom || null;
				returnGeom = options.returnGeom || false;
				fields = options.fields || ['*'];

				query = new EsriQuery();
				query.where = where;
				query.geometry = inputGeom;
				query.returnGeometry = returnGeom;
				query.outFields = fields;

				// Optional
				outStats = options.outStats || [];

				// Handle Output Statistics
				if (outStats.length) {

					var stats = [];

					_.each(outStats, function(def) {
						var statDef = new StatDef();
						statDef.statisticType = def.type;
						statDef.onStatisticField = def.field;
						statDef.outStatisticFieldName = def.name;
						stats.push(statDef);
					}, this);

					query.outStatistics = stats;
				}

				return query;
			};

			/**
			 * Execute the query, and call the callback function
			 * @param  { Object } query     Esri JSAPI Query object
			 * @param  { String} url       URL of the AGS layer to query
			 * @param  { Function } _callback Callback function
			 * @return { FeatureSet }           Esri JSAPI FeatureSet object
			 */
			this._executeQuery = function(query, url, _callback) {
				var queryTask = new QueryTask(url);
				queryTask.execute(query, _callback);
			};
		};
	});