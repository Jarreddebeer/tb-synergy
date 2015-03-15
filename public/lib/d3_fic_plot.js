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

// TODO: CALCULATE WITH PROPS
var drugCSteps = 0.32;
var drugBSteps = 0.05;
var numStepsC = 7;
var numStepsB = 9;

d3Chart.create = function(el, props, state) {
  this.props = props;
  this.props.colours = [
              '#B2182B',
              '#D6604D',
              '#F4A582',
              '#FDDBC7',
              '#E0E0E0',
              '#BABABA',
              '#878787',
              '#4D4D4D']
;
  this.props.color = d3.scale.quantile()
                        .domain([0,65000])
                        .range(this.props.colours);


  var svg = d3.select(el).append("svg")
            .attr("width", this.props.width + this.props.margins.left +
                    this.props.margins.right)
            .attr("height", this.props.height + this.props.margins.top +
                    this.props.margins.bottom)
        .append("g")
            .attr("transform", "translate(" + this.props.margins.left + "," +
                    this.props.margins.top + ")")
            .attr("class","d3-ficcurves-points");

    // Setup axes
  svg.append("g")
      .attr("id", "ficcurves-x-axis")
      .attr("class","axis")
      .attr("transform", "translate(0," + this.props.height + ")")
    .append("text")
      .attr("class","label")
      .attr("x", (this.props.width/2))
      .attr("y", this.props.margins.bottom - xAxisYOffset)
      .text("Drug B (µg/ml)");

  svg.append("g")
      .attr("id", "ficcurves-y-axis")
      .attr("class","axis")
    .append("text")
      .attr("class","label")
      .attr("transform", "rotate(-90)")
      .attr("y", - yAxisYOffset)
      .attr("x", -(this.props.height - this.props.margins.top)/2)
      .attr("dy", ".71em")
      .text("Drug C (µg/ml)")

  this.props.svg = svg;
  this.update(el, state);
};

d3Chart._filterToPlate = function(state) {
    var that = this,
        filteredData = [];
    state.data.forEach(function(datum) {
        if (datum.plate_num == state.selected_plate &&
            !that._filterNode(datum, state)) {
            filteredData.push(datum);
        }
    });
    return filteredData;
}

d3Chart._filterNode = function(d, state) {
    var ranges = state.display_ranges;
    for (var key in ranges) {
        if (ranges.hasOwnProperty(key)) {
           if (d[key] < ranges[key][0] ||
                 d[key] > ranges[key][1]) {
             return true;
           }
        }
    }
    return false;
};

d3Chart.update = function(el, state) {
    console.log("FIC: " + state.selected_point_index);
    var that = this;
    var data = this._filterToPlate(state);
    // Axes and scales
    var x = d3.scale.linear()
        .domain([0, (numStepsB + 1) * drugBSteps]).nice()
        .range([0, this.props.width]);

    var y = d3.scale.linear()
        .domain([0, (numStepsC + 1) * drugCSteps]).nice()
        .range([this.props.height, 0]);


    var xTicks = [],
        yTicks = [];
    for (var i = 0; i <numStepsB + 1; i++) {
       xTicks.push(i * drugBSteps);
    }

    for (var i = 0; i <numStepsC + 1; i++) {
       yTicks.push(i * drugCSteps);
    }

    var xAxis = d3.svg.axis()
        .scale(x)
        .tickValues(xTicks)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .tickValues(yTicks)
        .orient("left");

    d3.select("#ficcurves-x-axis").call(xAxis)
    d3.select("#ficcurves-y-axis").call(yAxis)

    // Squares
  var squares = this.props.svg.selectAll(".square")
      .data(data, function(d, i) {return d.row_index})
  squares.enter().append("rect")
        .attr("class", "square")
        .attr("x", function(d) { return x(d.b) })
        .attr("y", function(d) { return y(d.c) - (y(d.c) - y(d.c + drugCSteps)) })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", function(d) { return x(d.b + drugBSteps) - x(d.b)} )
        .attr("height", function(d) {return y(d.c) - y(d.c + drugCSteps)} )
        .style("fill", function(d) { return that.props.color(d.lumo)})
        .style("fill-opacity", circleNormalOpacity)
      .on("mouseover", function(d) {
        that.props.updateSelectedPoint(d.row_index);
        that._displayTooltip(this, d, that._calcPosition(d, x, y));
      })
      .on("mouseout", function(d) {
        that.props.updateSelectedPoint(-1);
        that._removeTooltip(this, d);
      });
  squares.exit().remove();
  squares.transition()
    .duration(tooltipFadeinTime)
    .style("fill-opacity", function(d) {
        if (d.row_index == state.selected_point_index) {
            return circleSelectedOpacity;
        } else {
            return circleNormalOpacity;
        }
    });
};

d3Chart.destroy = function(el) {
};

d3Chart._fadeInTooltip = function(sel) {
  sel.transition()
       .duration(tooltipFadeinTime)
       .style("opacity", tooltipVisibleOpacity);
}

d3Chart._formatDrugCon = function(d) {
    return "Drug A: " + this._formatNumber(d.a) + "<br/>" +
    "Drug B: " + this._formatNumber(d.b) + "<br/>" +
    "Drug C: " + this._formatNumber(d.c) + "<br/>" +
    "FIC: " + this._formatNumber(d.fic) + "<br/>" +
    "Luminosity: " + this._formatNumber(d.lumo);
}

d3Chart._displayTooltip = function(elm, d, pos) {
    // Position calculations
    var point = d3.select(elm);
    var matrix = elm.getScreenCTM()
                .translate(pos[0], pos[1]);
    var left = matrix.e + window.pageXOffset;
    var top =  matrix.f + window.pageYOffset;

     // Tooltips
    this._fadeInTooltip(d3.select(".tooltip"));
    d3.select(".tooltip").html(this._formatDrugCon(d))
           .style("left", left + 60 + "px")
           .style("top", top - 50+ "px");

}
d3Chart._removeTooltip = function(elm, d) {
  // Hide tooltips
  this._hideTooltip(d3.select(".tooltip"));

}

d3Chart._hideTooltip = function(sel) {
  sel.transition()
       .duration(500)
       .style("opacity", 0);

}

d3Chart._calcPosition = function(d, x, y) {
    return [x(d.b), y(d.c)];
};

d3Chart._formatNumber = function(num) {
    return Math.round(num*100)/100;
}
export default d3Chart;
