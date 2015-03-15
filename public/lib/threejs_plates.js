import d3 from 'd3';
import THREE from 'three';
import typeface from 'three.regular.helvetiker';
THREE.typeface_js.loadFace(typeface);

var threejsPlates = {};

threejsPlates.create = function(el, props, state) {

    this.props = props;
    this.props.colours = [
        0xB2182B,
        0xD6604D,
        0xF4A582,
        0xFDDBC7,
        0xE0E0E0,
        0xBABABA,
        0x878787,
        0x4D4D4D
    ];
    this.props.colour = d3.scale.quantile()
                         .domain([0, 65000])
                         .range(this.props.colours);
    this.mouse = new THREE.Vector2();
    this.cSize = 50;
    this.hSize = 200;
    this.cellMeshes = [];
    this.pickingData = [];

    this.container = d3.select(el).append('canvas')
      .attr("width", this.props.width + this.props.margins.left + this.props.margins.right)
      .attr("height", this.props.height + this.props.margins.top + this.props.margins.bottom);
    this.props.container = this.container;

    // extract the concentrations -> plate/col/row mapping
    var plates = this._extractPlateState(state.data);
    this.drugA = Object.keys(plates);
    this.drugB = this._extractColumnState(state.data, 'b');
    this.drugC = this._extractColumnState(state.data, 'c');

    this._init(state.data);
    this.update(el, state);

};

threejsPlates.update = function(el, state) {
    // var data = this._filteredData(state);
    this._updatePlateCellsVisibility(state);
    this._animate();
};

// private helper methods

threejsPlates._filteredData = function(state) {
    var filteredData = [],
        ranges = state.display_ranges;
    state.data.forEach(function(datum) {
        var addDatum = true;
        for (var key in ranges) {
            if (ranges.hasOwnProperty(key)) {
               if (datum[key] < ranges[key][0] ||
                     datum[key] > ranges[key][1]) {
                 addDatum = false;
                 break;
               }
            }
        }
        if(addDatum) {
            filteredData.push(datum);
        }
    });
    return filteredData;
};

threejsPlates._init = function(data) {

    var camScale = 1.00;
    var camVerticalOffset = 100;
    this.camera = new THREE.OrthographicCamera( -camScale * this.props.width, camScale * this.props.width, camScale * this.props.height, -camScale * this.props.height, -500, 1000 );
    this.camera.position.x = 280;
    this.camera.position.y = this.hSize * 6 / 2 - camVerticalOffset; // height with 6 plates is 700
    this.camera.position.z = 100;

    this.scene = new THREE.Scene();
    this.camera.lookAt(new THREE.Vector3(-5*this.cSize+80, 410 - camVerticalOffset, -4*this.cSize-100));

    this.pickingScene = new THREE.Scene();
    this.pickingTexture = new THREE.WebGLRenderTarget(this.props.width, this.props.height);
    this.pickingTexture.generateMipmaps = false;

    /*
    this.plates = this._extractPlateState(data);
    this.drugA = Object.keys(this.plates);
    this.drugB = this._extractColumnState(data, 'b');
    this.drugC = this._extractColumnState(data, 'c');
   */

    this._setLabels();
    this._setPlateCells(data);

    // lighting and rendering

    var ambientLight = new THREE.AmbientLight( 0xffffff );
    this.scene.add(ambientLight);

    this.renderer = new THREE.WebGLRenderer({
        canvas: this.container[0][0],
        antialias: true,
        alpha: true
    });
    this.renderer.setPixelRatio( this.props.devicePixelRatio );
    this.renderer.setSize(this.props.width, this.props.height);

    // this.renderer.domElement.addEventListener('mousemove', this._onMouseMove);

};

threejsPlates._animate = function() {
    // TODO: TOO SLOW FOR SOME REASON, even though the example is not
    // requestAnimationFrame(this._animate.bind(this));
    this._render();
};

threejsPlates._render = function() {
//    this._pick();
    this.renderer.render(this.scene, this.camera);
};

threejsPlates._pick = function() {
    this.renderer.render(this.pickingScene, this.camera, this.pickingTexture);

    var gl = this.renderer.getContext();
    var pixelBuffer = new Uint8Array(4);
    gl.readPixels(this.mouse.x, this.pickingTexture.height - this.mouse.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);

    var id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2] );
    var data = this.pickingData[id];

    if (data) {
        if (data.position && data.rotation && data.scale) {
            this.highlightBox.position.copy(data.position);
            this.highlightBox.rotation.copy(data.rotation);
            this.highlightBox.scale.copy(data.scale);
            this.highlightBox.visible = true;
        } else {
            this.highlightBox.visible = false;
        }
    }

};

this._onMouseMove = function(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
};

threejsPlates._updatePlateCellsVisibility = function(state) {

    // filter ranges
    var a = state.display_ranges.a;
    var b = state.display_ranges.b;
    var c = state.display_ranges.c;
    var l = state.display_ranges.lumo;
    var pn = state.display_ranges.plate_num;
    var spi = state.selected_point_index;

    var visible;
    for (var i = 0; i < state.data.length; i++) {
        var row = state.data[i];
        this.cellMeshes[i].visible = !(
            row.a < a[0] || row.a > a[1] ||
            row.b < b[0] || row.b > b[1] ||
            row.c < c[0] || row.c > c[1] ||
            row.lumo < l[0] || row.lumo > l[1]
        );
        this.cellMeshes[i].material.opacity = 0.8;
    }

    if (spi >= 0) {
        this.cellMeshes[spi].visible = true;
        this.cellMeshes[spi].material.opacity = 1;
    }
};

// only call this ONCE on init
threejsPlates._setPlateCells = function(rows) {

    // this.cellGeometry = new THREE.Geometry();
    // var pickingGeometry = new THREE.Geometry();

    // var color = new THREE.Color();
    var matrix = new THREE.Matrix4();
    var quaternion = new THREE.Quaternion();

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];

        var col = this.props.colour(row.lumo);
        var mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(this.cSize, this.cSize, 1),
            new THREE.MeshBasicMaterial({color: col, shading: THREE.FlatShading})
        );
        mesh.matrixAutoUpdate = false;
        mesh.rotationAutoUpdate = false;
        mesh.material.opacity = 0.8;

        var x = this.drugB[row.b];
        var y = row.plate_num; // this.plates[row.a];
        var z = this.drugC[row.c];

        var position = new THREE.Vector3();
        position.z = 7 * this.cSize - x * this.cSize;
        position.y = y * this.hSize;
        position.x = 9 * this.cSize - z * this.cSize;

        var rotation = new THREE.Euler();
        rotation.x = -1.57079633;

        var scale = new THREE.Vector3();
        scale.x = 1; scale.y = 1; scale.z = 1;

        quaternion.setFromEuler(rotation, false);
        matrix.compose(position, quaternion, scale);

        // applyVertexColors(geom, color.setHex(col));
        mesh.applyMatrix(matrix);

        this.cellMeshes[i] = mesh;
        this.scene.add(mesh);
        // this.cellGeometry.merge(geom, matrix);
        //
        // applyVertexColors(geom, color.setHex(i));
        // pickingGeometry.merge(geom, matrix);

        /*
        this.pickingData[i] = {
            position: position,
            rotation: rotation
        };
       */

        /*
        this.plateGeoms.push({
            x: x,
            y: y,
            z: z,
            geom: geom
        });
       */

    }

//    var defaultMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors });
    // var pickingMaterial = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors});
    // var drawnObject = new THREE.Mesh(this.cellGeometry, defaultMaterial);
    // this.scene.add(drawnObject);
    // this.pickingScene.add(new THREE.Mesh(pickingGeometry, pickingMaterial));

    /*
    this.highlightBox = new THREE.Mesh(
        new THREE.PlaneGeometry(this.cSize, this.cSize, 1),
        new THREE.MeshBasicMaterial({color: 0xffff00})
    );
   */
    // this.scene.add(this.highlightBox);

    // taken from http://threejs.org/examples/webgl_interactive_cubes_gpu.html
    // lines 93-103
    /*
    function applyVertexColors(g, c) {
        g.faces.forEach( function( f ) {
            var n = ( f instanceof THREE.Face3 ) ? 3 : 4;
            for( var j = 0; j < n; j ++ ) {
                f.vertexColors[ j ] = c;
            }
        } );
    }
   */
};

threejsPlates._setLabels = function() {

    this.labelGeometry = new THREE.Geometry();

    // generate grids along with drugA concentration labels
    var height;
    this._generateGrid(0);
    for (var i = 1; i < 6; i++) {
        height = i * this.hSize + 0.1;
        this._generateGrid(height);
    }

    for (var i = 1; i < this.drugA.length; i++) {
        var concentration = this.drugA[i];
        height = i * this.hSize + 0.1;
        var x = 10 * this.cSize + this.cSize/2;
        this._addTextLabel(concentration, x, height+20, -2*this.cSize);
    }

    // generate axes labels
    this._addTextLabel("(0, 0, 0)", this.cSize*7+25, -50, this.cSize*7);
    this._addTextLabel("A", -this.cSize, 2.5*this.hSize, this.cSize*7);
    this._addTextLabel("B", this.cSize*13, 0, this.cSize/2*8);
    this._addTextLabel("C", this.cSize/2*13+this.cSize/2, 0, this.cSize*12);

    // generate the 'volume' labels
    var volumeGeo = new THREE.Geometry();
    var v1 = new THREE.Vector3(2*this.cSize-this.cSize/2, 0, 8*this.cSize);
    var v2 = new THREE.Vector3(10*this.cSize-this.cSize/2, 0, 8*this.cSize);
    var v3 = new THREE.Vector3(2*this.cSize-this.cSize/2, 0, 10*this.cSize);
    var v4 = new THREE.Vector3(10*this.cSize, 0, -this.cSize/2 - 2*this.cSize);
    var v5 = new THREE.Vector3(10*this.cSize, 0, 8*this.cSize-this.cSize/2);
    var v6 = new THREE.Vector3(12*this.cSize-this.cSize/2, 0, -this.cSize/2 - 2*this.cSize);
    //
    volumeGeo.vertices.push(v1);
    volumeGeo.vertices.push(v2);
    volumeGeo.vertices.push(v3);
    volumeGeo.vertices.push(v4);
    volumeGeo.vertices.push(v5);
    volumeGeo.vertices.push(v6);
    //
    var up_normal = new THREE.Vector3(0, 1, 0);
    var volume_face_1 = new THREE.Face3(0, 2, 1, up_normal);
    var volume_face_2 = new THREE.Face3(3, 4, 5, up_normal);
    volumeGeo.faces.push(volume_face_1);
    volumeGeo.faces.push(volume_face_2);
    volumeGeo.computeFaceNormals();
    //
    var volume_material = new THREE.MeshBasicMaterial( { color: 1 * 0xbbbbbb, shading: THREE.FlatShading, overdraw: 0 } );
    var volume_mesh = new THREE.Mesh(volumeGeo, volume_material);
    volume_mesh.position.set(0, 0, 0);
    this.scene.add(volume_mesh);

    // generate vertical axes
    // north
    this.labelGeometry.vertices.push( new THREE.Vector3( 2*this.cSize-this.cSize/2, 0,            -2*this.cSize-this.cSize/2 ) );
    this.labelGeometry.vertices.push( new THREE.Vector3( 2*this.cSize-this.cSize/2, this.hSize*5, -2*this.cSize-this.cSize/2 ) );
    // south
    this.labelGeometry.vertices.push( new THREE.Vector3( 10*this.cSize-this.cSize/2, 0,            8*this.cSize-this.cSize/2 ) );
    this.labelGeometry.vertices.push( new THREE.Vector3( 10*this.cSize-this.cSize/2, this.hSize*5, 8*this.cSize-this.cSize/2 ) );
    // east
    this.labelGeometry.vertices.push( new THREE.Vector3( 10*this.cSize-this.cSize/2, 0,            -2*this.cSize-this.cSize/2 ) );
    this.labelGeometry.vertices.push( new THREE.Vector3( 10*this.cSize-this.cSize/2, this.hSize*5, -2*this.cSize-this.cSize/2 ) );
    // west
    this.labelGeometry.vertices.push( new THREE.Vector3( 2*this.cSize-this.cSize/2, 0,            8*this.cSize-this.cSize/2 ) );
    this.labelGeometry.vertices.push( new THREE.Vector3( 2*this.cSize-this.cSize/2, this.hSize*5, 8*this.cSize-this.cSize/2 ) );

    var geoMaterial = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.1 } );
    var geoLines = new THREE.Line( this.labelGeometry, geoMaterial, THREE.LinePieces );
    this.scene.add(geoLines);

};

threejsPlates._addTextLabel = function(theText, x, y, z) {

    var text3d = new THREE.TextGeometry( theText, {
        size: 28,
        height: 20,
        curveSegments: 2,
        font: "helvetiker"

    });

    text3d.computeBoundingBox();
    var centerOffset = -0.5 * ( text3d.boundingBox.max.x - text3d.boundingBox.min.x );

    var textMaterial = new THREE.MeshBasicMaterial( { color: 0x999999, overdraw: 0.5 } );
    var text = new THREE.Mesh( text3d, textMaterial );

    text.position.x = x + text3d.boundingBox.max.x;//centerOffset;
    text.position.y = 14 + y;
    text.position.z = z + text3d.boundingBox.max.x;

    // text looks at the camera. so we copy the cameras rotation
    text.rotation.x = this.camera.rotation._x;
    text.rotation.y = this.camera.rotation._y;
    text.rotation.z = this.camera.rotation._z;

    this.scene.add(text);

};

threejsPlates._generateGrid = function(height) {
    for (var i = 0; i <= 10; i++) {
        var z = 10 * this.cSize - i * this.cSize;
        this.labelGeometry.vertices.push( new THREE.Vector3( 9*this.cSize + this.cSize/2, height,   (7 * this.cSize + this.cSize/2) - z) );
        this.labelGeometry.vertices.push( new THREE.Vector3( 1*this.cSize + (this.cSize/2), height, (7 * this.cSize + this.cSize/2) - z) );
    }
    for (var j = 0; j <= 8; j++) {
        var x = 8 * this.cSize - j * this.cSize;
        this.labelGeometry.vertices.push( new THREE.Vector3( x+2 * this.cSize - this.cSize/2, height, (-2*this.cSize)-this.cSize/2 ) );
        this.labelGeometry.vertices.push( new THREE.Vector3( x+2 * this.cSize - this.cSize/2, height, 8*this.cSize-this.cSize/2 ) );
    }
};


threejsPlates._extractPlateState = function(rows) {
    var plate_numbers = {};
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var num = row.plate_num;
        if (typeof plate_numbers[num] == 'undefined') {
            plate_numbers[row.a] = num;
        }
    }
    return plate_numbers;
};

threejsPlates._extractColumnState = function(rows, key) {
    var cols = {};
    var count = 0;
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var num = row[key];
        if (typeof cols[num] == 'undefined') {
            cols[num] = count;
            count++;
        }
    }
    return cols;
};

export default threejsPlates;
