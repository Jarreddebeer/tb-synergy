import d3 from "d3"

// d3Chart.js

var d3Chart = {};

// Constants
var tooltipVisibleOpacity = 0.9,
    tooltipHiddenOpacity = 0,
    circleSelectedOpacity = 1.0,
    circleSelectedRadius = 10,
    circleNormalRadius = 3.5,
    circleNormalOpacity = 0.6,
    xAxisYOffset = 10,
    yAxisYOffset = 10,
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
      .attr("y", -(this.props.margins.left) + yAxisYOffset)
      .attr("x", -(this.props.height - this.props.margins.top -
                  this.props.margins.bottom)/2)
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

d3Chart.update = function(el, state) {
    var that = this;
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
  this.props.svg.selectAll(".dot")
      .data(state.data)
    .enter().append("circle")
      .attr("class","dot")
      .attr("r", circleNormalRadius)
      .attr("cx", function(d) {
          return x(d.fic);
      })
      .attr("cy", function(d) {
          return y(d.lumo);
      })
      .on("mouseover", function(d) {
      var circ = d3.select(this);
      var matrix = this.getScreenCTM()
                .translate(+this.getAttribute("cx"),
                +this.getAttribute("cy"));
      var xMatrix = this.getScreenCTM()
                .translate(0,that.props.height);
      var yMatrix = this.getScreenCTM()
                .translate(0,0);
         var left = matrix.e + window.pageXOffset
         var top =  matrix.f + window.pageYOffset
          d3.select(".tooltip").transition()
               .duration(tooltipFadeinTime)
               .style("opacity", tooltipVisibleOpacity);
          d3.select(".x-tooltip").transition()
               .duration(tooltipFadeinTime)
               .style("opacity", tooltipVisibleOpacity);
          d3.select(".y-tooltip").transition()
               .duration(tooltipFadeinTime)
               .style("opacity", tooltipVisibleOpacity);
          d3.select(".tooltip").html(
                "Drug A: " + that._formatNumber(d.a) + "<br/>" +
                "Drug B: " + that._formatNumber(d.b) + "<br/>" +
                "Drug C: " + that._formatNumber(d.c) + "<br/>")
               .style("left", left + 10 + "px")
               .style("top", top - 30+ "px");
          d3.select(".x-tooltip").html(that._formatNumber(d.fic))
               .style("left", left - 15 + "px")
               .style("top", (window.pageYOffset + xMatrix.f) + "px");
          d3.select(".y-tooltip").html(that._formatNumber(d.lumo))
               .style("left", (window.pageXOffset + yMatrix.e - 50) + "px")
               .style("top", top - 10 + "px");
          that.props.svg.append("svg:line")
              .attr("class","x-drop-line")
              .attr("x1", d3.select(this).attr("cx"))
              .attr("x2", d3.select(this).attr("cx"))
              .attr("y1", d3.select(this).attr("cy"))
              .attr("y2", that.props.height)
              .attr("stroke",d3.select(this).style("fill"))
              .attr("stroke-width","2");
          that.props.svg.append("svg:line")
              .attr("class","y-drop-line")
              .attr("x1", 0)
              .attr("x2", d3.select(this).attr("cx"))
              .attr("y1", d3.select(this).attr("cy"))
              .attr("y2", d3.select(this).attr("cy"))
              .attr("stroke",d3.select(this).style("fill"))
              .attr("stroke-width","2");
         circ.transition()
            .duration(tooltipFadeinTime)
            .style("fill-opacity", circleSelectedOpacity)
            .attr("r", circleSelectedRadius);
      })
      .on("mouseout", function(d) {
          d3.selectAll(".x-drop-line").remove();
          d3.selectAll(".y-drop-line").remove();
          d3.select(".tooltip").transition()
               .duration(500)
               .style("opacity", 0);
          d3.select(".x-tooltip").transition()
               .duration(500)
               .style("opacity", 0);
          d3.select(".y-tooltip").transition()
               .duration(500)
               .style("opacity", 0);
         d3.select(this).transition()
            .duration(500)
            .style("fill-opacity", circleNormalOpacity)
            .attr("r", 3.5);
      })
      .style("fill-opacity", circleNormalOpacity)
      .style("fill", function(d) { return color(d.plate_num); });

  var legend = this.props.svg.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .attr("class","legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", this.props.width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  legend.append("text")
      .attr("class","legend-text")
      .attr("x", this.props.width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .text(function(d) { return "Plate number " + d; });
};

d3Chart.destroy = function(el) {
};

d3Chart._formatNumber = function(num) {
    return Math.round(num*100)/100;
}

export default d3Chart;
