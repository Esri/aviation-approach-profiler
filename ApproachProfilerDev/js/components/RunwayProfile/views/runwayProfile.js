define([
  'app/config',

  'dojo/_base/lang',
  'dojo/_base/declare',
  'dojo/dom',
  'dojo/dom-style',
  'dojo/query',
  'dojo/text!../templates/template.html',
  'dojo/topic',

  'dijit/_TemplatedMixin',
  'dijit/_WidgetBase',

  'esri/IdentityManager',
  'esri/Color',
  'esri/geometry/Point',
  'esri/geometry/Polyline',
  'esri/graphic',
  'esri/layers/GraphicsLayer',
  'esri/SpatialReference',
  'esri/symbols/SimpleFillSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/SimpleMarkerSymbol',

], function(
  config,

  lang, declare, dom, domStyle, query, HtmlTemplate, topic,

  _TemplatedMixin, _WidgetBase,

  esriId, Color, Point, Polyline, Graphic, GraphicsLayer, SpatialReference, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol
) {
  return declare([_WidgetBase, _TemplatedMixin], {
    templateString: HtmlTemplate,
    // instance properties:
    // map: map ojbect,
    // layer: graphics layer object,
    // sfcKey: the key of the selected surface,
    // direction: normal or reverse display on chart (approach)
    constructor: function(args) {
      dojo.safeMixin(this, args);
      this.layer = new GraphicsLayer({
        opacity: 1.0
      });
      this.map.addLayer(this.layer);
      this.sfcKey = '';
      this.direction = '';
      this.currentApproachObj = '';

      // Used to initChart (reset zoom)
      this.obstructionFeatureID = '';
      topic.subscribe('ProfilerView/obstructionFeatureID', lang.hitch(this, function(id) {
        this.obstructionFeatureID = id;
      }));

    },
    postCreate: function() {
      // reset zoom button
      this.resetButton = d3.select('#' + this.id).append('span')
        .attr('class', 'btn btn-success reset-button')
        .text('Reset Zoom');
      this.resizeChart();
    },
    destroyChart: function() {},
    resizeChart: function() {},
    _initChartProperties: function() {

      this.offset = 0; // slope offset from origin (used to shift obstacles in service)
      this.xScaleMin = 0; // min value in the x-axis 
      this.xScaleMax = 0; // max value in the x-axis
      this.yScaleMin = 0; // min value in the y-axis
      this.yScaleMax = 0; // maxy value in the y-axis
      this.maxFocus = {}; // object for max elevation value during mouse/touch over
      this.minFocus = {}; // object for min elevation value during mouse/touch over
      this.slopeFocus = {}; // object for slope elevation value during mouse/touch over
      this.bothFoci = {}; // object holding the min, max, and slope focus objects
      this.margin = { // margins for chart
        top: 20,
        right: 20,
        bottom: 40,
        left: 50
      };
      // width of chart
      var appWidth = parseInt(d3.select('.navbar-container').style('width'), 10);
      this.width = appWidth - 40 - this.margin.left - this.margin.right;
      // height of chart
      this.height = 250 - this.margin.top - this.margin.bottom;
      // set up the axis (domains will be assigned during data parsing)
      this.xScale = d3.scale.linear()
        .range([0, this.width]);
      this.yScale = d3.scale.linear()
        .range([this.height, 0]);
      this.xAxis = d3.svg.axis()
        .scale(this.xScale)
        .orient('bottom')
        //format the text used to label the axis
        .tickFormat(function(d) {
          return d3.format(',.0f')(d) + 'm';
        })
        //add grid lines to chart
        .tickSize(-this.height)
        // space between chart and x-axis labels
        .tickPadding(config.labelOffset);
      this.yAxis = d3.svg.axis()
        .scale(this.yScale)
        .orient('left')
        //format the text used to label the axis
        .tickFormat(function(d) {
          return d3.format(',.0f')(d) + 'm';
        })
        //add grid lines to chart
        .tickSize(-this.width);
    },
    _initChartMethods: function() {
      // methods used for drawing the various types of data
      // these are referenced during the data joins (for drawing)

      // generic area method
      var xScale = this.xScale,
        yScale = this.yScale,
        height = this.height,
        offset = this.offset;
      this.gpArea = d3.svg.area()
        .x(function(d) {
          return xScale(d.m);
        })
        .y0(function(d) {
          return height;
        })
        .y1(function(d) {
          return yScale(d.z);
        })
        .interpolate('basis');

      //generic line method
      this.gpLine = d3.svg.line()
        .x(function(d) {
          return xScale(d.m);
        })
        .y(function(d) {
          return yScale(d.z);
        });

      //generic polygon method
      this.gpPolygon = d3.svg.area()
        .x(function(d) {
          return xScale(d.m);
        })
        .y0(function(d) {
          return yScale(d.z);
        })
        .y1(function(d) {
          return yScale(d.z2);
        })
        .interpolate('basis');

      //min ground elevation
      this.gpAreaMin = d3.svg.area()
        .x(function(d) {
          return xScale(d.distance / 1.000);
        })
        .y0(function(d) {
          return height;
        })
        .y1(function(d) {
          return yScale(d.zmin / 1.000);
        })
        .interpolate('basis');

      //max ground elevation
      this.gpAreaMax = d3.svg.area()
        .x(function(d) {
          return xScale(d.distance / 1.000);
        })
        .y0(function(d) {
          return height;
        })
        .y1(function(d) {
          return yScale(d.zmax / 1.000);
        })
        .interpolate('basis');

      //sea level
      this.belowZero = d3.svg.area()
        .x(function(d) {
          return xScale(d.distance / 1.000);
        })
        .y0(function(d) {
          return height;
        })
        .y1(function(d) {
          return yScale(d.z / 1.000);
        });

      //slope line
      this.offsetLine = d3.svg.line()
        .x(function(d) {
          return xScale((d.distance + offset) / 1.000);
        })
        .y(function(d) {
          return yScale(d.z / 1.000);
        });

      //runway line
      this.regularLine = d3.svg.line()
        .x(function(d) {
          return xScale(d.distance / 1.000);
        })
        .y(function(d) {
          return yScale(d.z / 1.000);
        });
    },
    _initChartSvg: function() {
      var width = this.width,
        height = this.height,
        margin = this.margin;

      // add the chart to the dom node
      this.svg = d3.select('#' + this.id).append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      // add a reference to the chart itself, and keep it within the axis
      this.chartSvg = d3.select('#' + this.id).select('svg').append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('x', margin.left)
        .attr('y', margin.top)
        .append('g');
    },
    _initChartEffects: function() {
      // chart effects - gradients and shadows
      // gradients:

      //gradient for min ground elevation
      this.gradient = this.chartSvg.append('svg:defs')
        .append('svg:linearGradient')
        .attr('id', 'gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%')
        .attr('spreadMethod', 'pad');
      this.gradient.append('svg:stop')
        .attr('id', 'gStop1')
        .attr('offset', '0%')
        .attr('stop-color', '#1e7b1e')
        .attr('stop-opacity', 0.3);
      this.gradient.append('svg:stop')
        .attr('id', 'gStop2')
        .attr('offset', '100%')
        .attr('stop-color', '#adebad')
        .attr('stop-opacity', 0.5);

      //gradient for max ground elevation
      this.maxGradient = this.chartSvg.append('svg:defs')
        .append('svg:linearGradient')
        .attr('id', 'maxGradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%')
        .attr('spreadMethod', 'pad');
      this.maxGradient.append('svg:stop')
        .attr('id', 'gStop1')
        .attr('offset', '0%')
        .attr('stop-color', '#adebad')
        .attr('stop-opacity', 0.3);
      this.maxGradient.append('svg:stop')
        .attr('id', 'gStop2')
        .attr('offset', '100%')
        .attr('stop-color', '#1e7b1e')
        .attr('stop-opacity', 0.5);

      //gradient for background (sky)
      this.skyGradient = this.chartSvg.append('svg:defs')
        .append('svg:linearGradient')
        .attr('id', 'skyGradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%')
        .attr('spreadMethod', 'pad');
      this.skyGradient.append('svg:stop')
        .attr('id', 'skyStop1')
        .attr('offset', '0%')
        .attr('stop-color', 'darkblue')
        .attr('stop-opacity', 0.4);
      this.skyGradient.append('svg:stop')
        .attr('id', 'skyStop2')
        .attr('offset', '40%')
        .attr('stop-color', 'lightblue')
        .attr('stop-opacity', 0.25);

      // filters:

      //filter for drop shadows
      this.filter = this.chartSvg.append('svg:defs').append('svg:filter')
        .attr('id', 'dropshadow');

      //append gaussian blur to filter
      this.filter.append('feGaussianBlur')
        .attr('in', 'SourceAlpha')
        .attr('stdDeviation', 3) // !!! important parameter - blur
        .attr('result', 'blur');

      //append offset filter to result of gaussion blur filter
      this.filter.append('feOffset')
        .attr('in', 'blur')
        .attr('dx', 2) // !!! important parameter - x-offset
        .attr('dy', 2) // !!! important parameter - y-offset
        .attr('result', 'offsetBlur');

      //merge result with original image
      this.feMerge = this.filter.append('feMerge');

      //first layer result of blur and offset
      this.feMerge.append('feMergeNode')
        .attr('in', 'offsetBlur');

      //original image on top
      this.feMerge.append('feMergeNode')
        .attr('in', 'SourceGraphic');
    },

    _initZoomBehavior: function() {
      // define zoom behavior
      this.zoom = d3.behavior.zoom()
        .scaleExtent([1, 100])
        .on('zoom', lang.hitch(this, function(evt) {

          // restrict the zoom/pan to the visible data extent
          var t = d3.event.translate,
            tx = t[0],
            ty = t[1];
          //keep within x-axis
          tx = Math.min(tx, 0);
          tx = Math.max(tx, (1 - d3.event.scale) * this.width);
          //keep within y-axis
          ty = Math.min(ty, 0);
          ty = Math.max(ty, (1 - d3.event.scale) * this.height);
          // apply the restriction, if necessary
          if (t[0] != tx || t[1] != ty) {
            this.zoom.translate([tx, ty]);
          }
          // redraw the data based on the new translate and scale values
          this.draw();
        }));

      // Reset zoom
      this.resetButton.on('click', lang.hitch(this, function() {
        this.initChart(this.obstructionFeatureID);

      }));

    },

    _initMouseHandling: function() {
      var gLayer = this.layer,
        bisectDistance = d3.bisector(function(d) {
          return d.m;
        }).left,
        runwayLineSymbol = new SimpleLineSymbol(config.approachLineSymbol),
        runwayPointSymbol = new SimpleMarkerSymbol(
          config.approachPointSymbol
        ),
        obstructionHoverSymbol = new SimpleMarkerSymbol(config.obstructionHoverSelectSymbol),
        positionGraphic,
        // Obstacle management during mouse/touch events
        oldCandidateIndex = -2,
        hideVisibleObstacle = function() {},
        visibleObstacle = {};

      // draw the corresponding mouse position on the map relative to the chart
      function drawPosition(side1, side2, percent, asPoint) {
        var geometry, symbol;
        if (typeof positionGraphic != 'undefined') {
          gLayer.remove(positionGraphic);
        }

        // Prevent trying to draw if side1/side2 left/right are undefined (outside chart)
        if (!side1.left || !side2.left) {
          return;
        }

        var pt1 = findY_PointPointPercent(side1.left, side2.left, percent);
        var pt2 = findY_PointPointPercent(side1.right, side2.right, percent);

        if (pt1.m <= 0 || pt2.m <= 0 || asPoint) {
          geometry = new Point(pt1.x, pt1.y, new SpatialReference({
            wkid: 4326
          }));
          symbol = runwayPointSymbol;
        } else {
          var polylineJson = {
            'paths': [
              [
                [pt1.x, pt1.y],
                [pt2.x, pt2.y]
              ]
            ],
            'spatialReference': {
              'wkid': 4326
            }
          };
          geometry = new Polyline(polylineJson);
          symbol = runwayLineSymbol;
        }

        positionGraphic = new Graphic(geometry, symbol);
        gLayer.add(positionGraphic);
      }

      // hide text/symbology when event is over
      this.mouseout = function(passedX) {
        gLayer.clear();
        oldCandidateIndex = -1;
        // hide all "focus" class elements (min, max, and slope elevations)
        d3.selectAll('.focus').style('display', 'none');
        // hide the current highlighted obstacle
        hideVisibleObstacle();
      };

      function findY_PointPointPercent(pt1, pt2, percent) {
        var y1 = pt1.y;
        var y2 = pt2.y;
        var x1 = pt1.x;
        var x2 = pt2.x;
        var m1 = pt1.m;
        var m2 = pt2.m;
        var z1 = pt1.z;
        var z2 = pt2.z;
        var slope = x2 == x1 ? null : (y2 - y1) / (x2 - x1);
        var x = x1 + percent * (x2 - x1);
        var y = slope === null ? y1 + percent * (y2 - y1) : slope * (x - x1) + y1;
        var m = m1 + percent * (m2 - m1);
        var z = z1 + percent * (z2 - z1);

        return {
          'x': x,
          'y': y,
          'm': m,
          'z': z
        };
      }

      // used in mousemove function and querySlope function
      function findY_PointPointX(pt1, pt2, passedX) {
        var y1 = pt1.y,
          y2 = pt2.y,
          // since m is a measure, this is what we really mean when we refer to x (i.e. on the graph)
          x1 = pt1.m,
          x2 = pt2.m,
          m1 = pt1.x,
          m2 = pt2.x,
          z1 = pt1.z,
          z2 = pt2.z,
          slope = x2 == x1 ? null : (y2 - y1) / (x2 - x1),
          x = passedX,
          y = slope === null ? y1 : slope * (x - x1) + y1,
          percent = x2 == x1 ? (y - y1) / (y2 - y1) : (x - x1) / (x2 - x1),
          m = m1 + percent * (m2 - m1),
          z = z1 + percent * (z2 - z1);
        return {
          'x': m,
          'y': y,
          'm': x,
          'z': z
        };
      }

      var thisObj = this;
      this.currentApproachObj = this;
      // show text/symbology when event is active
      this.mousemove = function(passedX) {
        var minGround = thisObj.minGround;
        var maxGround = thisObj.maxGround;
        var xScale = thisObj.xScale;
        var yScale = thisObj.yScale;
        var leftEdge = thisObj.leftEdge;
        var rightEdge = thisObj.rightEdge;
        var maxFocus = thisObj.maxFocus;
        var minFocus = thisObj.minFocus;
        var rwy = thisObj.rwyGround;
        
        // determine if touch or mouse event and then standardize to a single event
        // evtMove = (typeof d3.touch(this) == "undefined") ? d3.mouse(this) : d3.touch(this),
        // set geometry values for the event
        var x0 = passedX || xScale.invert(
          typeof d3.touch(d3.select('.overlay').node()) == 'undefined' ?
          d3.mouse(d3.select('.overlay').node())[0] :
          d3.touch(d3.select('.overlay').node())[0]
        );
        var i = bisectDistance(minGround, x0);
        var d0 = minGround[i - 1];
        var d1 = minGround[i];
        var j = bisectDistance(leftEdge, x0);
        var asPoint = false;
        // Prevents re-draw errors when window is resized
        if (typeof d0 !== 'undefined'){
          var percent = (x0 - d0.m) / (d1.m - d0.m);
          var line1 = {
            'left': leftEdge[j - 1],
            'right': rightEdge[j - 1]
          };
          var line2 = {
            'left': leftEdge[j],
            'right': rightEdge[j]
          };
          if (j==0){
            j=bisectDistance(rwy, x0);
            if (j>0 && j < rwy.length){
              line1 = {
                'left' : rwy[j-1],
                'right': rwy[j-1]
              }
              line2 = {
                'left' : rwy[j],
                'right': rwy[j]
              }
            }else{
              asPoint = true;
              line1 = {
                'left' : d0,
                'right': d1
              }
              line2 = {
                'left' : d0,
                'right': d1
              }
            }
          }
          var minPt = findY_PointPointX(minGround[i - 1], minGround[i], x0);
          var maxPt = findY_PointPointX(maxGround[i - 1], maxGround[i], x0);

          // draw indicator line in approach
          drawPosition(line1, line2, percent, asPoint);

          // set max ground elevation text placement
          maxFocus.attr('transform',
            'translate(' + xScale(maxPt.m) + ',' + yScale(maxPt.z) + ')');
          // set max ground elevation text value
          maxFocus.select('text')
            .text(config.maxElevationPrefix + d3.format('0f')(maxPt.z) + 'm');
          // set min ground elevation text placement
          minFocus.attr('transform', 'translate(' + xScale(minPt.m) + ',' + yScale(minPt.z) + ')');
          // set min ground elevation text value
          minFocus.select('text')
            .text(config.minElevationPrefix + d3.format('0f')(minPt.z) + 'm');
          // pass the event's x value to the obstacle query (see if near an obstacle)
          d3.selectAll('.focus').style('display', null);
          queryObstacles(xScale(x0)); // evtMove[0]);
          // set the slope elevation text value and placement
          querySlope(x0);
        }
      };

      // query the obstacles at a specific 'x'
      function queryObstacles(x) {
        var obsObjects = thisObj.obsObjects;
        var buffer = 50,
          min = buffer,
          candidateIndex = -1;

        // Exit query if no obstacles
        if (!obsObjects) {
          return;
        }

        for (var i = 0; i < obsObjects.length; i++) {
          if (Math.abs(obsObjects[i].d - x) < min) {
            min = Math.abs(obsObjects[i].d - x);
            candidateIndex = i;
          }
        }
        if (candidateIndex == oldCandidateIndex) {
          return;
        }
        oldCandidateIndex = candidateIndex;
        hideVisibleObstacle();
        if (candidateIndex == -1) {
          return;
        }
        visibleObstacle = obsObjects[candidateIndex].obj;
        var pt = new Point(d3.select(visibleObstacle).data()[0].X, d3.select(visibleObstacle).data()[0].Y);
        var graphic = new Graphic(pt, obstructionHoverSymbol);
        gLayer.add(graphic);
        d3.select(visibleObstacle).select('text').style('display', null);
        hideVisibleObstacle = function() {
          gLayer.remove(graphic);
          d3.select(visibleObstacle).select('text').style('display', 'none');
          hideVisibleObstacle = function() {};
        };
      }

      // query the slope for elevation at a specific 'x'
      function querySlope(x) {
        var slopeLine = d3.select('.slope-line')[0][0],
          xScale = thisObj.xScale,
          yScale = thisObj.yScale,
          slopeFocus = thisObj.slopeFocus,
          slopeData = d3.select(slopeLine).data()[0];
        if (x < slopeData[0].m) {
          // event is not over slope
          d3.selectAll('.slope-focus').style('display', 'none');
        } else {
          var i = bisectDistance(slopeData, x),
            d0 = slopeData[i - 1],
            d1 = slopeData[i],

            slopePt = findY_PointPointX(d0, d1, x);
          // event is over slope
          d3.selectAll('.slope-focus').style('display', null);
          // set max ground elevation text placement
          slopeFocus.attr('transform', 'translate(' + xScale(slopePt.m) + ',' + yScale(slopePt.z) + ')');
          // set min ground elevation text value
          slopeFocus.select('text')
            .text(config.slopeElevationPrefix + d3.format('0f')(slopePt.z) + 'm');
        }
      }
    },
    _initWindowResizing: function() {
      this.resizeChart = lang.hitch(this, function(w, h) {
        var svgNode = this.svg.node(),
          chartNode = this.chartSvg.node();
        w = w || parseInt(d3.select('.navbar-container').style('width'), 10) - 40;
        h = h || this.height + this.margin.top + this.margin.bottom;
        this.width = w - this.margin.left - this.margin.right;
        this.height = h - this.margin.top - this.margin.bottom;
        this.xScale.range([0, this.width]);
        this.yScale.range([this.height, 0]);
        this.xAxis.tickSize(-this.height).tickPadding(config.labelOffset);
        d3.select('.x, .axis').attr('transform', 'translate(0,' + this.height + ')');
        this.yAxis.tickSize(-this.width);
        d3.select(svgNode.parentNode)
          .attr('width', this.width + this.margin.left + this.margin.right)
          .attr('height', this.height + this.margin.top + this.margin.bottom);
        d3.select(chartNode.parentNode)
          .attr('width', this.width)
          .attr('height', this.height);
        d3.select('.background-overlay')
          .attr('width', this.width)
          .attr('height', this.height);
        d3.select('.overlay')
          .attr('width', this.width)
          .attr('height', this.height);
        this.draw();
        this.setZoomExtent();
      });
      d3.select(window).on('resize', lang.hitch(this, function() {
        this.resizeChart();
      }));
    },
    _initChart: function() {
      if (!this.chartInitialized) {
        this.chartInitialized = true;
        this._initChartProperties();
        this._initChartMethods();
      }
      this._initChartSvg();
      this._initChartEffects();
      this._initZoomBehavior();
      this._initMouseHandling();
      this._initWindowResizing();
    },
    setZoomExtent: function(xmin, xmax, ymin, ymax) {

      xmin = xmin || this.xScaleMin;
      xmax = xmax || this.xScaleMax;
      ymin = ymin || this.yScaleMin;
      ymax = ymax || this.yScaleMax;
      var xScale = this.xScale,
        yScale = this.yScale,
        xExt = [xmin, xmax],
        yExt = [ymin, ymax],
        zoom = this.zoom,
        draw = this.draw;

      d3.transition().duration(750).tween('zoom', lang.hitch(this, function() {
        console.log('setting zoom');
        var ix = d3.interpolate(xScale.domain(), xExt),
          iy = d3.interpolate(yScale.domain(), yExt);
        return lang.hitch(this, function(t) {
          zoom.x(xScale.domain(ix(t))).y(yScale.domain(iy(t)));
          draw();
        });
      }));
    },

    buildObstaclesObject: function() {
      var obstructions = d3.selectAll('.obstructions-g')[0];
      var data = d3.selectAll('.obstructions-g').data();
      this.obsObjects = [];
      for (var i = 0; i < obstructions.length; i++) {
        var obs = obstructions[i];
        var x = parseFloat(d3.select(obs).attr('transform').split('(')[1]);
        this.obsObjects.push({
          'd': x,
          'obj': obs
        });
      }
    },
    getObstacles: function(data) {
      var obstacles = data,
        xScale = this.xScale,
        yScale = this.yScale,
        xScaleMin = this.xScaleMin,
        yScaleMax = this.yScaleMax,
        offset = this.offset;


      if (obstacles.length === 0) {
        this.obsObjects = []; //clear the obstacle object
        return;
      }

      // buildings
      var barG = this.chartSvg.selectAll('g.obstructions')
        .data(obstacles)
        .enter().append('g')
        .attr('transform', function(d, i) {
          return 'translate(' + xScale(d.NormalDist + offset) + ', ' + yScale(d.ZVMC) + ')';
        })
        .attr('class', 'obstructions-g');

      // Reset domain for buffer drawing on reverse approaches
      if (this.direction === 'reverse') {
        this.xScale.domain([this.xScaleMin, this.xScaleMax]);
      }

      // buffer
      barG.append('rect')
        .attr('x', function(d) {
          return xScale(xScaleMin + d.HACCM) * -1;
        })
        .attr('width', function(d) {
          return xScale(xScaleMin + d.HACCM) * 2;
        })
        .attr('y', function(d) {
          return yScale(yScaleMax - d.VACCM) * -1;
        })
        .attr('height', function(d) {
          return yScale(yScaleMax - d.VACCM - d.Height);
        })
        .attr('class', 'obs-buffer')
        .classed('penetrates', function(d) {
          return 0;
        });

      // Reset domain for buffer drawing on reverse approaches
      if (this.direction === 'reverse') {
        this.xScale.domain([this.xScaleMax, this.xScaleMin]);
      }

      // actual building line
      barG.append('rect')
        .attr('height', function(d) {
          return yScale(yScaleMax - d.Height);
        })
        .attr('width', 0.5)
        .attr('class', 'obstruction')
        .classed('penetrates', function(d) {
          return 0;
        });

      // building text label...
      var heightText = barG.append('text')
        .attr('class', 'focus-text')
        .attr('y', function(d) {
          return yScale(yScaleMax - d.VACCM) * -1;
        })
        .style('text-anchor', 'middle')
        .style('display', 'none');

      // ... in three containers
      heightText.append('tspan')
        .attr('x', 0)
        .attr('y', '-2em')
        .style('font-weight', 'bold')
        .style('fill', config.obstructionTextColor)
        .text(function(d) {
          return d.Type_Code;
        });

      heightText.append('tspan')
        .attr('x', 0)
        .attr('y', '-1em')
        .style('font-weight', 'bold')
        .style('fill', config.obstructionTextColor)
        .style('text-decoration', 'underline')
        .text(function(d) {
          return d3.format('0f')(d.ZVM) + 'm';
        });

      this.buildObstaclesObject();
    },

    draw: function() {

      var xScale = this.xScale,
        yScale = this.yScale,
        offset = this.offset;

      // Ignore first call to svg as it isn't created yet.
      if (!this.svg) {
        return;
      }

      // redraw axes
      this.svg.select('g.x.axis').call(this.xAxis)
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', function(d) {
          return 'rotate(-20)';
        });
      this.svg.select('g.y.axis').call(this.yAxis);

      // redraw lines and areas
      this.chartSvg.select('path.below-zero').attr('d', this.gpArea);
      this.chartSvg.select('path.runway-line').attr('d', this.gpLine);
      this.chartSvg.select('path.slope-line').attr('d', this.gpLine);
      this.chartSvg.select('path.areaMax').attr('d', this.gpArea);
      this.chartSvg.select('path.areaMin').attr('d', this.gpArea);

      // redraw obstructions
      this.chartSvg.selectAll('g.obstructions-g')
        .attr('transform', function(d, i) {
          return 'translate(' + xScale(d.NormalDist + offset) + ', ' + yScale(d.ZVMC) + ')';
        });

      var currentDirection = this.direction;

      //obstacle buffers
      this.chartSvg.selectAll('rect.obs-buffer')
        .attr('x', function(d) {
          if (currentDirection === 'reverse') {
            return xScale(xScale.domain()[0] + d.HACCM);
          } else {
            return xScale(xScale.domain()[0] + d.HACCM) * -1;
          }
        })
        .attr('width', function(d) {
          if (currentDirection === 'reverse') {
            return xScale(xScale.domain()[0] + d.HACCM) * -2;
          } else {
            return xScale(xScale.domain()[0] + d.HACCM) * 2;
          }
        })
        .attr('y', function(d) {
          return yScale(yScale.domain()[1] - d.VACCM) * -1;
        })
        .attr('height', function(d) {
          return yScale(yScale.domain()[1] - d.VACCM - d.Height);
        });
      this.chartSvg.selectAll('rect.obstruction')
        .attr('height', function(d) {
          return yScale(yScale.domain()[1] - d.Height);
        });
      this.chartSvg.selectAll('g.obstructions-g text')
        .attr('y', function(d) {
          return yScale(yScale.domain()[1] - d.VACCM) * -1;
        });

      this.buildObstaclesObject();
      if (this === window) {
        return;
      }
      this.mousemove();
    },
    parsePaths: function(paths) {
      var set = [];
      for (var i = 0; i < paths.length; i++) {
        var obj = {};
        var len = paths[i].length;
        if (len > 4) {
          obj.z2 = paths[i][4];
        }
        if (len > 3) {
          obj.m = paths[i][3];
        }
        if (len > 2) {
          obj.z = paths[i][2];
        }
        obj.x = paths[i][0];
        obj.y = paths[i][1];
        set.push(obj);
      }
      return set;
    },
    sortData: function(data) {
      if (data && data.length > 0) {
        var key = data[0].m != 'undefined' ? 'm' : 'x';
        data = data.sort(function(a, b) {
          if (a[key] > b[key]) {
            return 1;
          }
          if (a[key] < b[key]) {
            return -1;
          }
          if (a[key] === b[key]) {
            return 0;
          }
        });
      }
      return data;
    },

    interpolateLine: function(paths, sampling_Distance) {
      if (paths.length != 2) {
        console.warn('interpolateLine: not two points');
        return paths;
      }

      var xStepDelta = (paths[1].x - paths[0].x) / (paths[1].m - paths[0].m) * sampling_Distance;

      var yStepDelta = (paths[1].y - paths[0].y) / (paths[1].m - paths[0].m) * sampling_Distance;

      var zStepDelta = (paths[1].z - paths[0].z) / (paths[1].m - paths[0].m) * sampling_Distance;

      var mDirection = paths[1].m > 0 ? 1 : -1;

      var numSteps = Math.floor(Math.abs(paths[1].m - paths[0].m) / sampling_Distance);
      if ((paths[1].m - paths[0].m) % sampling_Distance === 0) {
        numSteps--;
      }

      var set = [];
      set.push(paths[0]);

      for (var i = 1; i <= numSteps; i++) {
        var obj = {};
        obj.x = paths[0].x + xStepDelta * i;
        obj.y = paths[0].y + yStepDelta * i;
        obj.z = paths[0].z + zStepDelta * i;
        obj.m = paths[0].m + sampling_Distance * i * mDirection;
        if (paths[0].z2) {
          obj.z2 = paths[0].z2; // not interpolrate z2
        }
        set.push(obj);
      }
      set.push(paths[1]);

      return set;

    },

    initChart: function(sfcKey, queriedObstacles) {
      this.destroyChart();

      this._surfaceGraphic = new Graphic(
        app.profiler._selectedSurface.geometry,
        new SimpleFillSymbol(config.approachFootprintSelectSymbol)
      );

      this.map.graphics.add(this._surfaceGraphic);


      if (this.graphicsHandlerMove) {
        this.graphicsHandlerMove.remove();
      }
      this.graphicsHandlerMove = this.map.graphics.on('mouse-move', lang.hitch(this, function(e) {
        if (e.graphic == this._surfaceGraphic) {
          // console.log(e.mapPoint);
          // console.log(this.currentApproachObj.leftEdge[e.x]);
          // console.log(this.currentApproachObj.leftEdge[0]);
          // _.each(this.currentApproachObj.leftEdge, function(edge){
          //   console.log(edge.x, e.mapPoint.x);
          //   if (e.mapPoint.x == edge.x){
          //     console.log('found one');
          //   }
          // });
          // console.log(this.currentApproachObj.leftEdge);
          //   var x = this.profile.normalDistanceTo(new LatLon(e.mapPoint.getLatitude(), e.mapPoint.getLongitude())) / 0.3048
          //   this.mousemove(x);
        }
      }));


      if (this.graphicsHandlerOut) {
        this.graphicsHandlerOut.remove();
      }
      this.graphicsHandlerOut = this.map.graphics.on('mouse-out', lang.hitch(this, function(e) {
        this.mouseout();
      }));
      this.sfcKey = sfcKey || '';

      this._initChart();

      var modelName = query('input[type=radio]:checked')[0].value;
      var model = app.config.layerList.models[modelName];

      var mapSvc = app.layerLookup[model.layers.footprint.name].url + '/query';
      qString = '?where=' + model.runwayKeyField + '%3D' + sfcKey + '&outFields=' + model.runwayKeyField + '%2C' + model.runwaySlopeField + '%2C' + model.ProfileJsonField + '%2C' + model.obstacleJsonField + '&returnGeometry=false&f=json';

      var token = esriId.findCredential(app.config.AGOLOrgUrl).token;
      qString = qString + '&token=' + token;

      // load the data initially
      d3.json(mapSvc + qString, lang.hitch(this, function(error, featureSet) {
        if (error) {
          console.warn(error);
          alert(error.message);
          return;
        }

        this.data = JSON.parse(featureSet.features[0].attributes[model.ProfileJsonField]);

        if (!this.data) {
          alert('This OIS surface has not been processed yet.  Please choose another one.');
          return;
        }

        this.rwyGround = []; //runway data
        this.gapGround = []; //gap data
        this.minGround = []; //min elevation under OIS
        this.maxGround = []; //max elevation under OIS
        this.oisSurface = []; //OIS surface data
        this.leftEdge = []; //left edge of OIS
        this.rightEdge = []; //right edge of OIS

        // get the slop from the attributes
        this.slope = 0; // line slope value of OIS

        this.sfcKey = this.data.SurfaceDescription; // SFC_RWY_KEY

        this.azimuth = 286.0021752667592; // angle for extended centerline
        this.offset = 0; // offset value for adding to obs distances

        // reusable data
        this.description.innerHTML = this.data.SurfaceDescription.replace('_', ' ').replace('_', '/').replace('_', ' (').replace('_', ' END)');
        this.title.innerHTML = this.data.RunwayDesignator + '&nbsp&nbsp|&nbsp&nbsp';
        var sampling_Distance = this.data.Sampling_Distance;
        this.rwyGround = this.interpolateLine(this.parsePaths(this.data.RunwayCenterline.paths[0].reverse()), sampling_Distance);
        this.oisSurface = this.interpolateLine(this.parsePaths(this.data.OIS.paths[0]), sampling_Distance);

        this.minGround = this.parsePaths(this.data.Min.paths[0]);
        this.maxGround = this.parsePaths(this.data.Max.paths[0]);

        // use the end of the runway centerline
        this.origin = {
          'x': this.data.RunwayCenterline.paths[0][0][0],
          'y': this.data.RunwayCenterline.paths[0][0][1],
          'spatialReference': this.data.RunwayCenterline.spatialReference
        };

        this.leftEdge = this.parsePaths(this.data.LeftEdge.paths[0]); //removed [0]. a single line, 
        this.rightEdge = this.parsePaths(this.data.RightEdge.paths[0]);

        // add ground data elements together

        // Include runway
        var rMax = d3.max(this.rwyGround, function(x) {
            return x.m;
          }),
          sMin = d3.min(this.minGround, function(x) {
            return x.m;
          }),
          rwy = this.rwyGround.filter(function(x) {
            return sMin > x.m;
          }),
          gap = this.gapGround.filter(function(x) {
            return sMin > x.m > rMax;
          });

        rwy = this.rwyGround;
        this.minGround = rwy.concat(this.minGround);
        this.maxGround = rwy.concat(this.maxGround);
        //this.leftEdge = rwy.concat(this.leftEdge);
        //this.rightEdge = rwy.concat(this.rightEdge);

        // needs to be sorted for the hover text.
        this.rwyGround = this.sortData(this.rwyGround);
        this.minGround = this.sortData(this.minGround);
        this.maxGround = this.sortData(this.maxGround);
        this.oisSurface = this.sortData(this.oisSurface);
        this.leftEdge = this.sortData(this.leftEdge);
        this.rightEdge = this.sortData(this.rightEdge);
        this.xScaleMin = -Math.abs(config.xScaleMin);

        this.xScaleMax = d3.max(this.oisSurface, function(d) {
          return d.m;
        });
        this.yScaleMin = Math.min(
          d3.min(this.minGround, function(d) {
            return d.z;
          }),
          d3.min(this.rwyGround, function(d) {
            return d.z;
          })
        );
        this.yScaleMax = d3.max(this.oisSurface, function(d) {
          return d.z;
        });

        this.yScaleMin = this.yScaleMin - config.yAxisBuffer;
        this.yScaleMax = this.yScaleMax + Math.max(Math.abs(this.yScaleMax * 0.05), 100);

        this.xScale.domain([this.xScaleMin, this.xScaleMax]);
        this.yScale.domain([this.yScaleMin, this.yScaleMax]);
        // initialize the zoom behavior. this seems needed so that the
        // zoom-on-buffer-double-click plays nicely with the rest of the zoom.

        // Checks direction of approach and changes domain based on left/right approach.
        if (this.minGround[0].x <= this.minGround[this.minGround.length - 1].x) {
          this.xScale.domain([this.xScaleMin, this.xScaleMax]);
          this.direction = 'normal';
        } else {
          this.xScale.domain([this.xScaleMax, this.xScaleMin]);
          this.direction = 'reverse';
        }

        this.zoom.x(this.xScale)
          .y(this.yScale);

        // chart background overlay
        this.chartSvg.append('rect')
          .attr('class', 'background-overlay')
          .attr('fill', 'url(#skyGradient)')
          .attr('width', this.width)
          .attr('height', this.height);

        // maxz area. in the background.
        this.chartSvg.append('path')
          .datum(this.maxGround)
          .attr('class', 'areaMax')
          .attr('filter', 'url(#dropshadow)')
          .attr('fill', 'url(#maxGradient)')
          .attr('d', this.gpArea);

        // minz area. in front of maxArea, since this will be shorter
        this.chartSvg.append('path')
          .datum(this.minGround)
          .attr('class', 'areaMin')
          .attr('filter', 'url(#dropshadow)')
          .attr('fill', 'url(#gradient)')
          .attr('d', this.gpArea);

        // blue fill for areas below zero, only if there are points below sea level.
        // between zmax and zmin.
        if (this.yScaleMin < 0) {
          this.chartSvg.append('path')
            .datum([{
              'm': this.xScaleMin,
              'z': 0
            }, {
              'm': this.xScaleMax,
              'z': 0
            }])
            .attr('class', 'below-zero')
            .attr('d', this.gpArea);
        }

        // runway
        this.chartSvg.append('path')
          .datum(this.rwyGround)
          .attr('class', 'runway-line')
          .attr('filter', 'url(#dropshadow)')
          .attr('d', this.gpLine);

        // slope
        this.chartSvg.append('path')
          .datum(this.oisSurface)
          .attr('class', 'slope-line')
          .attr('filter', 'url(#dropshadow)')
          .attr('d', this.gpLine);

        var verticalIndicator = this.chartSvg.append('line')
          .attr('y1', 0)
          .attr('y2', this.height)
          .style('stroke-width', 2)
          .style('stroke', app.config.verticalIndicatorColor)
          .style('fill', 'none');

        this.chartSvg.on('mouseover', function() {
          verticalIndicator.style('display', 'inherit');
        }).on('mouseout', function() {
          verticalIndicator.style('display', 'none');
        }).on('mousemove', function() {});
        this.chartSvg.on('mousemove', function() {
          var mouse = d3.mouse(this);
          verticalIndicator.attr('x1', mouse[0])
            .attr('x2', mouse[0]);
        });

        // hover labels
        this.maxFocus = this.chartSvg.append('g')
          .attr('class', 'focus max-focus')
          .style('display', 'none')
          .style('fill', config.elevationTextColor);

        this.minFocus = this.chartSvg.append('g')
          .attr('class', 'focus min-focus')
          .style('display', 'none')
          .style('fill', config.elevationTextColor);

        this.slopeFocus = this.chartSvg.append('g')
          .attr('class', 'focus slope-focus')
          .style('fill', config.slopeLineColor);

        this.bothFoci = d3.selectAll('.focus');

        this.bothFoci.append('circle')
          .attr('class', 'focus svg-focus')
          .attr('r', 2.5);

        this.bothFoci.append('text')
          .attr('y', function(d) {
            return (d3.select(this.parentNode).classed('max-focus')) ? -10 : (d3.select(this.parentNode).classed('slope-focus')) ? -10 : 10;
          })
          .attr('dy', '.35em')
          .style('text-anchor', 'middle');

        // zoom and hover labels overlay
        this.chartSvg.append('rect')
          .attr('class', 'overlay')
          .attr('width', this.width)
          .attr('height', this.height)
          .on('mouseover', lang.hitch(this, function() {
            d3.selectAll('.focus').style('display', null);
          }))
          .on('touchstart', lang.hitch(this, function() {
            d3.selectAll('.focus').style('display', null);
          }))
          .on('mousemove', this.mousemove)
          .on('touchmove', this.mousemove)
          .on('mouseout', this.mouseout)
          .on('touchend', this.mouseout)
          .call(this.zoom);

        // x axis labels and such
        this.svg.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + this.height + ')')
          .call(this.xAxis)
          .selectAll('text')
          .style('text-anchor', 'end')
          .attr('dx', '0em')
          .attr('dy', '.8em')
          .attr('transform', function(d) {
            return 'rotate(-20)';
          });

        // y axis
        this.svg.append('g')
          .attr('class', 'y axis')
          .call(this.yAxis);

        var obstaclesJSON = JSON.parse(featureSet.features[0].attributes[model.obstacleJsonField]);
        obstaclesJSON = obstaclesJSON.Obstacles;

        if (!obstaclesJSON) {
          console.log('This OIS surface has not been processed yet.  Please choose another one.');
          obstaclesJSON = {};
        }

        this.getObstacles(obstaclesJSON);
        this.configChart();
      }));

      this.destroyChart = lang.hitch(this, function() {
        this.map.graphics.remove(this._surfaceGraphic);
        $(d3.select(this.svg).node()[0][0].parentNode).remove();
      });

    },

    configChart: function() {
      var slopeLine = query('.slope-line')[0];
      var slopeLineColor = config.slopeLineColor;
      domStyle.set(slopeLine, {
        stroke: slopeLineColor
      });

      var runwayLine = query('.runway-line')[0];
      var runwayLineColor = config.runwayLineColor;
      domStyle.set(runwayLine, {
        stroke: runwayLineColor
      });
    }
  });
});
