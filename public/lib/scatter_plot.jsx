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
      width: 1000,
      height: 500,
      margins: {top: 20, right: 20, bottom: 30, left: 100},
    }, this.getChartState());
  },

  componentDidUpdate: function() {
    var el = this.getDOMNode();
    d3Chart.update(el, this.getChartState());
  },

  getChartState: function() {
    return {
      data: this.props.data,
      display_ranges: this.props.display_ranges
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