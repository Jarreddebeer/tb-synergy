import React from "react"
import ui from "github:components/jqueryui@1.11.4"

export default React.createClass({
  componentDidMount: function() {
      var that = this;
      $(function() {
        that.props.keysToFilter.forEach(function(key) {
            $( "#slider-range-"+key ).slider({
              range: true,
              min: that.props.display_ranges[key][0],
              max: that.props.display_ranges[key][1],
              step: 0.05,
              values: [ that.props.display_ranges[key][0], that.props.display_ranges[key][1]],
              slide: function( event, ui ) {
                that.props.updateDisplayRange(key, ui.values);
                $( "#"+key+"-values" ).val(ui.values[ 0 ] + " - " + ui.values[ 1 ] );
              }
            });
            $( "#"+key+"-values").val(that.props.display_ranges[key][0] + " - "+ that.props.display_ranges[key][1]);
        });

        $( "#slider-plate").slider({
          min: that.props.display_ranges.plate_num[0],
          max: that.props.display_ranges.plate_num[1],
          step: 1,
          value: that.props.selected_plate,
          slide: function( event, ui ) {
            that.props.updatePlate(ui.value);
            $( "#plate-value").val(ui.value);
          }
        });
        $( "#plate-value").val(that.props.selected_plate);

      });
  },

  componentDidUpdate: function() {
    var el = this.getDOMNode();
  },

  componentWillUnmount: function() {
    var el = this.getDOMNode();
  },

  render: function() {
    return (
      <div className="filters">
      {this.props.keysToFilter.map(function(key){
        return (
        <div key={key}>
        <p>
          <label for={key+"-values"}>{key} range:</label>
          <input type="text" id={key+"-values"}></input>
        </p>
        <div id={"slider-range-"+key}></div> 
        </div>)
        })}
        <div key={"plate"}>
        <p>
          <label for="plate-value">Plate:</label>
          <input type="text" id="plate-value"></input>
        </p>
        <div id="slider-plate"></div> 
        </div>)
      </div>
    );
  }
});
