import React from 'react';
import d3Chart from './d3_scatter_plot';

export default React.createClass({
  propTypes: {
    data: React.PropTypes.array,
    domain: React.PropTypes.object
  },

  render: function() {
    return (
      <div className="scatterplot">
        Scatter Plot
      </div>
    );
  }
});
