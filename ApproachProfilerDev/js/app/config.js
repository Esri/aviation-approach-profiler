/* global define */

/*
 | Copyright 2015 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */

define([], function() {

	return {

		// ############################################
		//   ArcGIS Online settings 
		// ############################################

		// ArcGIS Online Url, Portal Url (optional)
		AGOLOrgUrl: 'http://airport.map.arcgis.com/', 
		portalUrl: '',

		// Registered App ID, Web map
		appId: 'htTDubVfdMTfUlYh',
		webmap: '309e64b9c33d4eb6b3babbda9bde2a34',

		// ############################################
		//   App style settings
		// ############################################

		// Header
		//  - Note: Color format is rgb(r,g,b) or hex (#xxxxxx)
		applicationTitle: 'Approach Profiler',
		applicationNavBarColor: 'rgb(8, 49, 86)', // #083156
		applicationNavBarTextColor: 'rgb(255, 255, 255)',
		applicationNavBarBorder: {
			color: 'rgb(8, 49, 86)',
			width: '1px',
			style: 'solid'
		},

		// Slider
		slider: {
			// False hides slider
			slider: true,

			// Horizontal or vertical
			sliderOrientation: 'vertical',
			// Small or large
			sliderStyle: 'small'
		},

		// Map highlight settings
		//  - Note: alpha is 0-255 in dojo, not 0-1 as expected

		approachFootprintSelectSymbol: {
			'type': 'esriSFS',
			'style': 'esriSFSNull',
			'color': [255, 255, 0, 0],
			'outline': {
				'type': 'esriSLS',
				'style': 'esriSLSSolid',
				'color': [255, 255, 0, 191],
				'width': 3
			}
		},

		approachPointSymbol: {
			'type': 'esriSMS',
			'style': 'esriSMSCircle',
			'color': [255, 255, 0, 64],
			'size': 5,
			'angle': 0,
			'xoffset': 0,
			'yoffset': 0,
			'outline': {
				'color': [255, 255, 0, 191],
				'width': 3
			}
		},

		approachLineSymbol: {
			'type': 'esriSLS',
			'style': 'esriSLSSolid',
			'color': [255, 255, 0, 191],
			'width': 3
		},

		obstructionHoverSelectSymbol: {
			'type': 'esriSMS',
			'style': 'esriSMSCircle',
			'color': [0, 255, 0, 64],
			'size': 20,
			'angle': 0,
			'xoffset': 0,
			'yoffset': 0,
			'outline': {
				'color': [255, 0, 0, 191],
				'width': 3
			}
		},

		// Chart settings
		//  - Note: Color format is rgb(r,g,b) or hex (#xxxxxx)
		elevationTextColor: 'rgb(0, 0, 0)',
		obstructionTextColor: 'rgb(0, 0, 0)',
		slopeLineColor: 'rgb(148, 15, 50)',
		runwayLineColor: 'rgb(0, 0, 0)',
		verticalIndicatorColor: 'rgb(0, 255, 255)',

		// Text prefix to value in meters on chart.
		slopeElevationPrefix: '',
		maxElevationPrefix: 'Max:',
		minElevationPrefix: 'Min:' ,

		// Label offset
		//  - Note: Positive value = away from chart
		labelOffset: 10,

		// Distance between end of approach and edge of graph
		//  - Note: Value in meters
		xScaleMin: 1000,
		
		// Distance between y-axis and lowest value
		//  - Note: Value in meters less than lowest value
		yAxisBuffer: 40,

		// ############################################
		//   App service settings
		// ############################################

		// Url to geometry server
		geometryService: {
			url: 'http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer'
		},

		// Configure geocoder
		geocoder: {
			// Url to geocoder.  Defaults to Esri World Locator if empty
			url: '',

			// Prioritize country in search results using sourceCountry code
			sourceCountry: 'USA',

			// Place holder text in search bar prior to entering a value
			placeholderText: 'Find a location',

			autoComplete: true,
			autoNavigate: true,

			// Specify the list of out fields
			outFields: '',

			// Specify categories for filtering
			categories: '',

			// Location search will be performed when map scale is less than minscale using distance as a search distance from location
			localSearchOptions: {
				// Default is 15000
				minScale: 300000,

				//Default is 12000 meters
				distance: 50000,
			},

			// adds marker to geocoded location
			highlightLocation: true,

			// configure highlight symbol
			//  - Note: alpha is 0-255 in dojo, not 0-1 as expected
			highlightLocationSymbol: {
				'color': [255, 255, 255, 64],
				'size': 12,
				'angle': -30,
				'xoffset': 0,
				'yoffset': 0,
				'type': 'esriSMS',
				'style': 'esriSMSCircle',
				'outline': {
					'color': [0, 0, 0, 255],
					'width': 1,
					'type': 'esriSLS',
					'style': 'esriSLSSolid'
				}
			}
		},

		// ############################################
		//   App config settings
		// ############################################

		// Add proxy if needed (optional)
		proxy: {
			url: '',
			alwaysUseProxy: false,
			rules: [ /* Add URLs here*/ ]
		},

		// Basemaps
		basemaps: {

			// Default basemap on load
			default: 'topo',

			// Additional basemaps included in dropdown.
			//   - Options: 'streets', 'satellite', 'hybrid', 'topo', 'gray', 'oceans', 'national-geographic', 'osm'
			options: [{
				label: 'Topographic',
				value: 'topo'
			}, {
				label: 'Imagery',
				value: 'satellite'
			}, {
				label: 'Hybrid',
				value: 'hybrid'
			}, {
				label: 'Streets',
				value: 'streets'
			}, {
				label: 'Gray',
				value: 'gray'
			}]
		},

		// Initial model to load
		defaultModel: 'annex15',

		// Models, respective layers, and attributes
		//  - Duplicate as necessary for additional models (modelName: {..})
		layerList: {
			models: {
				annex14: {

					// Model name (used for defaultModel also) and label in dropdown
					name: 'annex14',
					label: 'Annex 14',

					// Layer names must match web map (case sensitive)
					layers: {
						footprint: {
							name: 'OIS_outline14'
							
						},
						heatmap: {
							name: 'heatmap14'
							
						},
						obstruction: {
							name: 'ObstaclePoint14'
							
						},
						contours:{
							name: 'contour14'
						},
						elevBand:{
							name: 'elevBand14'
						},
						accuracy:{
						 	name: 'accuracy14'
						}
					},

					// Model attributes (case sensitive)
					runwayKeyField: 'OBJECTID', //'SRC_RNWY_KEY', //"DESCRIP",	
					runwaySlopeField: 'SLOPE ',
					ProfileJsonField: 'ProfileJSON',
					obstacleJsonField: 'ObstacleJSON',
					runwayDesgKey: 'RWYDESG'


				},
				annex15: {
					name: 'annex15',
					label: 'Annex 15 (eTOD)',
					layers: {
						footprint: {
							name: 'OIS_outline15'
							
						},
						heatmap: {
							name: 'heatmap15'
							// name: 'Annex15_Heatmap'
						},
						obstruction: {
							name: 'ObstaclePoint15'
							
						},
						contours:{
							name: 'contour15'
						},
						elevBand:{
							name: 'elevBand15'
						},
						accuracy:{
							name: 'accuracy15'
						 }
					},
					runwayKeyField: 'OBJECTID', 	
					runwaySlopeField: 'SLOPE ',
					ProfileJsonField: 'ProfileJSON',
					obstacleJsonField: 'ObstacleJSON',
					runwayDesgKey: 'RWYDESG'

					
				}
			}
		}
	};
});
