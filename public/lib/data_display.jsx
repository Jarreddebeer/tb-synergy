import React from "react"
export default React.createClass({
  render: function() {
    return (
    <div className="row">
        <div className="row">
            <div className="col-sm-6" id="graph-1">
                #graph-1
            </div>
            <div className="col-sm-6">
                <div className="row">
                    <div className="col-sm-12" id="graph-2">
                        #graph-2
                    </div>
                    <div className="col-sm-12" id="graph-3">
                        #graph-3
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
