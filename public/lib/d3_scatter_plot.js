import d3 from "d3"

// d3Chart.js

var d3Chart = {};

// Constants
var tooltipVisibleOpacity = 0.9,
    tooltipHiddenOpacity = 0,
    circleSelectedOpacity = 1.0,
    pointSelectedSize = 200,
    pointNormalSize = 50,
    circleNormalOpacity = 0.6,
    xAxisYOffset = 10,
    yAxisYOffset = 75,
    tooltipFadeinTime = 200;

d3Chart.create = function(el, props, state) {
  this.props = props;
  var svg = d3.select(el).append("svg")
            .attr("width", this.props.width + this.props.margins.left +
                    this.props.margins.right)
            .attr("height", this.props.height + this.props.margins.top +
                    this.props.margins.bottom)
        .append("g")
            .attr("transform", "translate(" + this.props.margins.left + "," +
                    this.props.margins.top + ")")
            .attr("class","d3-scatterplot-points");

    // Setup axes
  svg.append("g")
      .attr("id", "scatterplot-x-axis")
      .attr("class","axis")
      .attr("transform", "translate(0," + this.props.height + ")")
    .append("text")
      .attr("class","label")
      .attr("x", (this.props.width/2))
      .attr("y", this.props.margins.bottom - xAxisYOffset)
      .text("FIC");

  svg.append("g")
      .attr("id", "scatterplot-y-axis")
      .attr("class","axis")
    .append("text")
      .attr("class","label")
      .attr("transform", "rotate(-90)")
      .attr("y", - yAxisYOffset)
      .attr("x", -(this.props.height - this.props.margins.top)/2)
      .attr("dy", ".71em")
      .text("Luminosity")

  var tooltip = d3.select("body").append("div")
      .attr("class","tooltip tooltip-style")
      .style("opacity", tooltipHiddenOpacity);

  var yTooltip = d3.select("body").append("div")
      .attr("class","y-tooltip small-tooltip-style")
      .style("opacity", tooltipHiddenOpacity);

  var xTooltip = d3.select("body").append("div")
      .attr("class","x-tooltip small-tooltip-style")
      .style("opacity", tooltipHiddenOpacity);

  this.props.svg = svg;
  this.update(el, state);
};

d3Chart._filteredData = function(state) {
    var filteredData = [],
        ranges = state.display_ranges;
    state.data.forEach(function(datum) {
        var addDatum = true;
        for (var key in ranges) {
            if (ranges.hasOwnProperty(key)) {
               if (datum[key] < ranges[key][0] ||
                     datum[key] > ranges[key][1]) {
                 addDatum = false;
                 break;
               }
            }
        }
        if(addDatum) {
            filteredData.push(datum);
        }
    });
    return filteredData;
},

d3Chart.update = function(el, state) {
    var that = this,
        data = this._filteredData(state);
    // Axes and scales
    var x = d3.scale.linear()
        .range([0, this.props.width]);

    var y = d3.scale.linear()
        .range([this.props.height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");
    var color = d3.scale.category10();

    x.domain(d3.extent(state.data, function(d) { return d.fic; })).nice();
    y.domain(d3.extent(state.data, function(d) { return d.lumo; })).nice();
  d3.select("#scatterplot-x-axis").call(xAxis)
  d3.select("#scatterplot-y-axis").call(yAxis)

  // Points
  var points = this.props.svg.selectAll(".dot")
      .data(data, function(d, i) {return d.row_index})
   points.enter().append("path")
      .attr("class","dot")
      //.attr("r", circleNormalRadius)
      .attr("transform", function(d) {
          var pos = that._calcPosition(d, x, y);
          return "translate(" + pos[0] + "," + pos[1] + ")";
      })
      .on("mouseover", function(d) {
        that.props.updateSelectedPoint(d.row_index);
        that._displayTooltip(this, d, that._calcPosition(d, x, y));
      })
      .on("mouseout", function(d) {
        that.props.updateSelectedPoint(-1);
        that._removeTooltip(this, d);
      })
      .on("click", function(d) {
        that.props.updatePlate(d.plate_num);
      })
      .style("fill-opacity", circleNormalOpacity)
      .style("fill", function(d) { return color(d.plate_num); });
    points.exit().remove();


     // Highlight point
     points.transition()
        .duration(tooltipFadeinTime)
        .style("fill-opacity", function(d) {
           if(d.row_index == state.selected_point_index){
                return circleSelectedOpacity;
           } else {
                return circleNormalOpacity;
           }
       })
       .attr("d", d3.svg.symbol()
        .type(function(d) { return that._getSVGSymbol(d.plate_num)})
        .size( function(d) {
           if(d.row_index == state.selected_point_index){
                return pointSelectedSize
           } else {
                return pointNormalSize;
           }
        }))

  // Legend
  var legend = this.props.svg.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .attr("class","legend")
      .attr("transform", function(d, i) { return "translate(" + that.props.width + "," + i * 20 + ")"; });

  legend.append("path")
      .attr("transform", function(d) {
          var pos = that._calcPosition(d, x, y);
          return "translate(" + -14 + "," + 7 + ")";
      })
      .attr("d", d3.svg.symbol()
          .size(function(d) { return pointNormalSize; })
          .type(function(d, i) { return that._getSVGSymbol(i)}))
      .style("fill", color);

  legend.append("text")
      .attr("class","legend-text")
      .attr("x", -24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .text(function(d) { return "Plate number " + d + ": "; });
};

d3Chart._calcPosition = function(d, x, y) {
    return [x(d.fic), y(d.lumo)];
};

d3Chart._removeTooltip = function(elm, d) {
  // Hide tooltips
  this._hideTooltip(d3.select(".tooltip"));
  this._hideTooltip(d3.select(".x-tooltip"));
  this._hideTooltip(d3.select(".y-tooltip"));

  // Remove droplines
  d3.selectAll(".x-drop-line").remove();
  d3.selectAll(".y-drop-line").remove();
}

d3Chart._hideTooltip = function(sel) {
  sel.transition()
       .duration(500)
       .style("opacity", 0);

}

d3Chart._fadeInTooltip = function(sel) {
  sel.transition()
       .duration(tooltipFadeinTime)
       .style("opacity", tooltipVisibleOpacity);
}

d3Chart._formatDrugCon = function(d) {
    return "Drug A: " + this._formatNumber(d.a) + "<br/>" +
    "Drug B: " + this._formatNumber(d.b) + "<br/>" +
    "Drug C: " + this._formatNumber(d.c) + "<br/>"
}

d3Chart._getSVGSymbol = function(plate_num) {
    return d3.svg.symbolTypes[plate_num];
}

d3Chart._displayTooltip = function(elm, d, pos) {
    // Position calculations
    var point = d3.select(elm);
    var matrix = elm.getScreenCTM()
                //.translate(pos[0], pos[1]);
                .translate(0, 0);
    var xMatrix = elm.getScreenCTM()
                .translate(0, -pos[1] + this.props.height);
    var yMatrix = elm.getScreenCTM()
                .translate(-pos[0],0);
    var left = matrix.e + window.pageXOffset;
    var top =  matrix.f + window.pageYOffset;

     // Tooltips
    this._fadeInTooltip(d3.select(".tooltip"));
    this._fadeInTooltip(d3.select(".x-tooltip"));
    this._fadeInTooltip(d3.select(".y-tooltip"));
    d3.select(".tooltip").html(this._formatDrugCon(d))
           .style("left", left + 10 + "px")
           .style("top", top - 30+ "px");
    d3.select(".x-tooltip").html(this._formatNumber(d.fic))
           .style("left", left - 15 + "px")
           .style("top", (window.pageYOffset + xMatrix.f) + "px");
    d3.select(".y-tooltip").html(this._formatNumber(d.lumo))
           .style("left", (window.pageXOffset + yMatrix.e - 50) + "px")
           .style("top", top - 10 + "px");

      // Drop Lines
    this.props.svg.append("svg:line")
          .attr("class","x-drop-line")
          .attr("x1", pos[0])
          .attr("x2", pos[0])
          .attr("y1", pos[1])
          .attr("y2", this.props.height)
          .attr("stroke",point.style("fill"))
          .attr("stroke-width","2");
    this.props.svg.append("svg:line")
          .attr("class","y-drop-line")
          .attr("x1", 0)
          .attr("x2", pos[0])
          .attr("y1", pos[1])
          .attr("y2", pos[1])
          .attr("stroke", point.style("fill"))
          .attr("stroke-width","2");
}

d3Chart.destroy = function(el) {
};

d3Chart._formatNumber = function(num) {
    return Math.round(num*100)/100;
}

export default d3Chart;
