import React from 'react';
import threejsPlates from './threejs_plates';

export default React.createClass({

  propTypes: {
    data: React.PropTypes.array,
    domain: React.PropTypes.object
  },

  componentDidMount: function() {
    var el = this.getDOMNode();
    threejsPlates.create(el, {
      devicePixelRatio: window.devicePixelRatio,
      width: 450,
      height: 700,
      margins: {top: 20, right: 20, bottom: 50, left: 100}
    }, this.getChartState());
  },

  componentDidUpdate: function() {
    var el = this.getDOMNode();
//    threejsPlates.update(el, this.getChartState());
  },

  getChartState: function() {
    return {
        data: this.props.data,
        display_ranges: this.props.display_ranges
    }
  },

  componentWillUnmount: function() {
    var el = this.getDOMNode();
  },

  render: function() {
    return (
            <div className="plates">
            </div>
    );
  }

});
