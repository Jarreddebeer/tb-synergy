import React from "react"
import ui from "github:components/jqueryui@1.11.4"

export default React.createClass({
  componentDidMount: function() {
      var that = this;
      $(function() {
        that.props.keysToFilter.forEach(function(key) {
            var orientation = (key == "c" || key == "lumo" || key == "a") ? 'vertical' : 'horizontal';
            var start_display_range = that.props.display_ranges[key][0];
            if (key == "lumo") {
                start_display_range = 15000;
            }
            $( "#slider-range-"+key ).slider({
              orientation: orientation,
              range: true,
              min: start_display_range,
              max: that.props.display_ranges[key][1],
              step: 0.05,
              values: [ start_display_range, that.props.display_ranges[key][1]],
              slide: function( event, ui ) {
                that.props.updateDisplayRange(key, ui.values);
              }
            });
            $( "#"+key+"-values").val(start_display_range + " - "+ that.props.display_ranges[key][1]);
        });

        $( "#slider-plate").slider({
          orientation: "vertical",
          min: that.props.display_ranges.plate_num[0],
          max: that.props.display_ranges.plate_num[1],
          step: 1,
          value: that.props.selected_plate,
          slide: function( event, ui ) {
            that.props.updatePlate(ui.value);
          }
        });
        $( "#plate-value").val(that.props.selected_plate);
      });
  },

  componentDidUpdate: function() {
    var that = this;
    // if someone else updated the slider, make sure it's reflected here
    $("#slider-plate").slider("value", this.props.selected_plate);
    // update labels
    $( "#plate-value").val(this.props.selected_plate);
    this.props.keysToFilter.forEach(function(key) {
        $( "#"+key+"-values" ).val(that.props.display_ranges[key][0]+ " - " + that.props.display_ranges[key][1]);
    });
  },

  render: function() {
    return (
      <div className="filters">
        <div id="plate-select" key={"plate"}>
            <div id="slider-plate"></div>
        </div>
        {this.props.keysToFilter.map(function(key){
          return (
          <div id={"slider-"+key} key={key}>
              <p>
                <label for={key+"-values"}>{key}:</label>
                <input readonly="readonly" type="text" id={key+"-values"}></input>
              </p>
              <div id={"slider-range-"+key}></div>
          </div>)
        })}
      </div>
    );
  }
});
