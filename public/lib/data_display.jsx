import React from "react"
import d3 from "d3"
import Plate from "./plates.jsx!"
import ScatterPlot from "./scatter_plot.jsx!"
import FicCurves from "./fic_curves.jsx!"

var DataDisplay = React.createClass({
  getInitialState: function() {
    return {
        display_ranges: this.getDataRanges(this.props.data)
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
  
  render: function() {
    return (
    <div className="row">
        <div className="row">
            <div className="col-sm-6" id="graph-1">
                <Plate data={this.props.data} display_ranges={this.state.display_ranges} />
            </div>
            <div className="col-sm-6">
                <div className="row">
                    <div className="col-sm-12" id="graph-2">
                        <ScatterPlot data={this.props.data} display_ranges={this.state.display_ranges} />
                    </div>
                    <div className="col-sm-12" id="graph-3">
                        <FicCurves data={this.props.data} display_ranges={this.state.display_ranges} />
                    </div>
                </div>
            </div>
        </div>
        <div className="row">
            <div className="col-sm-12" id="filters">
                #filters
            </div>
        </div>
    </div>
    );
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
