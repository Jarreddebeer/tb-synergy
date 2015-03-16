import React from 'react';
import d3Chart from './d3_scatter_plot';

export default React.createClass({
  propTypes: {
    data: React.PropTypes.array,
    domain: React.PropTypes.object
  },

  componentDidMount: function() {
    var el = this.getDOMNode();
    d3Chart.create(el, {
      width: 700,
      height: 700,
      margins: {top: 20, right: 80, bottom: 50, left: 100},
      updatePlate: this.props.updatePlate,
      updateSelectedPoint: this.props.updateSelectedPoint,
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
    };
  },

  componentWillUnmount: function() {
    var el = this.getDOMNode();
  },

  render: function() {
    return (
      <div className="scatterplot">
      </div>
    );
  }
});
