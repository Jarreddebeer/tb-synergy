import React from "react"
import d3 from "d3"
import Plate from "./plates.jsx!"
import ScatterPlot from "./scatter_plot.jsx!"
import FicCurves from "./fic_curves.jsx!"
import FilterControls from "./filter_controls.jsx!"

var DataDisplay = React.createClass({
  getInitialState: function() {
    var selectedPointIndex = this.getBestPoint(this.props.data);
    return {
        display_ranges: this.getDataRanges(this.props.data),
        selected_point_index: selectedPointIndex,
        selected_plate: this.props.data[selectedPointIndex].plate_num
    };
  },

  getDataRanges: function(data) {
    var keys = ["a","b","c", "fic", "lumo", "plate_num"],
        ranges = {};
    keys.forEach(function(key) { ranges[key] = [0,0]});
    this.props.data.forEach(function(datum){
        keys.forEach(function(key) {
            var val = datum[key];
            if (val < ranges[key][0]) {
                ranges[key][0] = val;
            } else if (val > ranges[key][1]) {
                ranges[key][1] = val;
            }
        });
    });
    return ranges;
  },

  getBestPoint: function(data) {
    var point = null,
        index = null;
    this.props.data.forEach(function(datum, i) {
        if (datum.lumo < 65000 && (!point || datum.fic < point.fic)) {
            point = datum;
            index = i;
        }
    });
    return index;
  },
  
  render: function() {
    return (
    <div className="row">
        <div className="row">
            <div className="col-sm-6" id="graph-1">
                <Plate data={this.props.data} display_ranges={this.state.display_ranges} selected_point_index={this.state.selected_point_index}/>
            </div>
            <div className="col-sm-6">
                    <div className="row" id="graph-2">
                        <ScatterPlot data={this.props.data} display_ranges={this.state.display_ranges} selected_point_index={this.state.selected_point_index}/>
                    </div>
                    <div className="row" id="graph-3">
                        <FicCurves data={this.props.data} display_ranges={this.state.display_ranges} selected_point_index={this.state.selected_point_index} selected_plate={this.state.selected_plate}/>
                    </div>
            </div>
        </div>
        <div className="row">
            <div className="col-sm-12" id="filters">
                <FilterControls data={this.props.data} 
                                 selected_plate={this.state.selected_plate} 
                                display_ranges={this.state.display_ranges}
                                updateDisplayRange={this.updateDisplayRange}
                                updatePlate={this.updatePlate}
                                keysToFilter={["lumo","a","b","c"]}/>
            </div>
        </div>
    </div>
    );
  },

  updateDisplayRange: function(key, newRange) {
    var ranges = this.state.display_ranges;
    ranges[key] = newRange;
    this.setState({display_ranges: ranges});
  },

  updatePlate: function(newPlateNum) {
    this.setState({selected_plate: newPlateNum});
  }
});

function parseDrugData(row){
    var headings = ["a","b","c","lumo","plate_num","fic"],
        datum = {};
    headings.forEach(function(h){
        datum[h] = +row[h];
    });
    return datum;
}
d3.csv("data/drug_data.csv")
    .row(parseDrugData)
    .get(function(error, rows){
        React.render(<DataDisplay data={rows}/>, 
            document.getElementById("data-display"));
    })
export default DataDisplay;
