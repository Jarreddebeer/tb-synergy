import d3 from "d3"
// d3Chart.js

var d3Chart = {};

d3Chart.create = function(el, props, state) {
  this.props = props;
  var svg = d3.select(el).append("svg")
            .attr("width", this.props.width + this.props.margins.left + this.props.margins.right)
            .attr("height", this.props.height + this.props.margins.top + this.props.margins.bottom)
        .append("g")
            .attr("transform", "translate(" + this.props.margins.left + "," + this.props.margins.top + ")")
            .attr("class","d3-scatterplot-points");

    // Setup axes
  svg.append("g")
      .attr("id", "scatterplot-x-axis")
      .attr("transform", "translate(0," + this.props.height + ")")
    .append("text")
      .attr("class", "label")
      .attr("x", this.props.width - this.props.margins.left - this.props.margins.right)
      .attr("y", -6)
      .style("text-anchor", "end")
      .text("fic");

  svg.append("g")
      .attr("id", "scatterplot-y-axis")
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Luminosity")

  var tooltip = d3.select(el).append("div")
      .attr("class", "tooltip tooltip-style")
      .style("opacity", 0);

  var yTooltip = d3.select(el).append("div")
      .attr("class", "y-tooltip small-tooltip-style")
      .style("opacity", 0);

  var xTooltip = d3.select(el).append("div")
      .attr("class", "x-tooltip small-tooltip-style")
      .style("opacity", 0);

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
      .attr("class", "dot")
      .attr("r", 3.5)
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
      var otherMatrix = this.getScreenCTM()
                .translate(+this.getAttribute("cx"),that.props.height);
         var left = (window.pageXOffset + matrix.e)
         var top =  (window.pageYOffset + matrix.f)
          d3.select(".tooltip").transition()
               .duration(200)
               .style("opacity", .9);
          d3.select(".x-tooltip").transition()
               .duration(200)
               .style("opacity", .9);
          d3.select(".y-tooltip").transition()
               .duration(200)
               .style("opacity", .9);
          d3.select(".tooltip").html(
                "Drug A: " + that._formatNumber(d.a) + "<br/>" +
                "Drug B: " + that._formatNumber(d.b) + "<br/>" +
                "Drug C: " + that._formatNumber(d.c) + "<br/>")
               .style("left", left + 10 + "px")
               .style("top", (top - 70) + "px");
          d3.select(".x-tooltip").html(that._formatNumber(d.fic))
               .style("left", (left - 12) + "px")
               .style("top", (window.pageYOffset + otherMatrix.f + 7) + "px");
          d3.select(".y-tooltip").html(that._formatNumber(d.lumo))
               .style("left", 43 + "px")
               .style("top", (top - 10) + "px");
         circ.transition()
            .duration(200)
            .style("fill-opacity", 1) // TODO: move to CSS
            .attr("r", 10);
      })
      .on("mouseout", function(d) {
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
            .style("fill-opacity", 0.6) // TODO: move to CSS
            .attr("r", 3.5);
      })
      .style("fill-opacity", 0.6) // TODO: move to CSS
      .style("fill", function(d) { return color(d.plate_num); });

  var legend = this.props.svg.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

  legend.append("rect")
      .attr("x", this.props.width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

  legend.append("text")
      .attr("x", this.props.width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return "Plate number " + d; });
};

d3Chart.destroy = function(el) {
};

d3Chart._formatNumber = function(num) {
    return Math.round(num*100)/100;
}

export default d3Chart;
