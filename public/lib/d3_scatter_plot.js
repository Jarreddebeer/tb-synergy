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
  this.props.svg = svg;
  this.update(el, state);
};

d3Chart.update = function(el, state) {
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

export default d3Chart;
