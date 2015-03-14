import React from "react"
import d3Chart from './d3_fic_plot';

export default React.createClass({
  componentDidMount: function() {
    var el = this.getDOMNode();
    d3Chart.create(el, {
      width: 600,
      height: 400,
      margins: {top: 20, right: 20, bottom: 50, left: 100},
    }, this.getChartState());
  },

  componentDidUpdate: function() {
    var el = this.getDOMNode();
    d3Chart.update(el, this.getChartState());
  },

  getChartState: function() {
    return {
      data: this.props.data,
      display_ranges: this.props.display_ranges,
      selected_point_index: this.props.selected_point_index,
      selected_plate: this.props.selected_plate
    };
  },

  componentWillUnmount: function() {
    var el = this.getDOMNode();
  },

  render: function() {
    return (
      <div className="fic_curves">
          <h2> Plate {this.props.selected_plate} </h2>
      </div>
    );
  }
});
