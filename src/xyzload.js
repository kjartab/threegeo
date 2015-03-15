/*
	XYZ loader. Returns geometry

*/

var xyzLoader = (function () {

	/* Bounding box */
	var minX,maxX;
	var minY,maxY;
	var minZ,maxZ;
	var geometry;
	var geometryList = [];
	var rows = 0;
	var cols = 0;
	var count = 0;
	
	
	var baseGeometry;
	
	/* Private functions */
	
	function validatePixel(data,noDataValue) {
		if (data.length != 3) {
			console.log('Too short');
			return false;
		} else if (+data[2] <= noDataValue) {
			console.log('at point number ' + count);
			console.log(data);
			return false;
		}
		return true;
	}
	
	
	/* Public functions */
	
	function loadData(xyzData, worldReference) {
		var deliminator = delim || '\n';
		var lines = xyzData.split('\n');
		
		var geometry = new THREE.Geometry();
		geometry.faceVertexUvs[0] = [];
		loadXYZlines(lines,worldReference.getScale());
		loadGroundFaces(geometry);
		
		
		/* Add walls */
		//addNorthSouthWalls(1500,geometry,cols,rows,2);
		//addEastWestWalls(1500,geometry,cols,rows,2);
		
		
		addNorthSouthWalls(-4,geometry,cols,rows,1);
		addEastWestWalls(-4,geometry,cols,rows,1);
		
		addLid(-4,geometry,cols,rows,1); /* Bottom */
		
		var materials = [];
			materials.push( new THREE.MeshLambertMaterial({  color: 0xcccccc, shading: THREE.SmoothShading}) );
			materials.push( new THREE.MeshBasicMaterial( { color: 0x343434,  depthTest: true}) );
			materials.push( new THREE.MeshLambertMaterial({color: 0x000033, transparent: true, opacity: 0.3})	 );

		var plane = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ));
			geometry.computeFaceNormals();
			geometry.computeVertexNormals();
			console.log(geometry.scale);

		window.scene.add(plane);
		
		//addWater(buildOutlineGeometry(1500,geometry,cols,rows));

		console.log('min values');
		console.log(minX/scale);
		console.log(minY/scale);
		console.log(minZ/scale);
		
		worldReference.setOffsets(minX/scale,minY/scale, minZ/scale);
		console.log(worldReference);
		console.log(worldReference.toString());
		
		return geometryList;
	}
	
		
		
	function loadXYZlines(lines,scale) {
	
		for (var i=0; i<lines.length; i++) {
			pixel = lines[i].split(' ');
			if( validatePixel(pixel,-9999)) {
			
			
				if(!minX) {
					minX = maxX = pixel[0]*scale;
					minY = maxY = pixel[1]*scale;
					minZ = maxZ = pixel[2]*scale;
				}
				
				if (pixel[0]*scale == minX) {
					rows++;
				}
				if(pixel[1]*scale == maxY) {
					cols++;
				}
				
				if(pixel[0]*scale > maxX) {
					maxX = pixel[0]*scale;
				}
				
				if(pixel[0]*scale > maxY) {
					maxY = pixel[1]*scale;
				}
					
				if(pixel[0]*scale > maxZ) {
					maxZ = pixel[2]*scale;
				}
				geometry.vertices.push(new THREE.Vector3(pixel[0]*scale-minX,pixel[1]*scale-minY,pixel[2]*scale-minZ));
			}
			
			
			count++;
		}
		
	}
		
	function loadGroundFaces(geometry) {
		
		var upper_left, upper_left, lower_left, lower_right;
		
		for (var i=0; i<cols-1; i++) {
			for (var j=0; j<rows-1; j++) {
			
				upper_left = j*cols + i;
				upper_right = j*cols + i +1;
				lower_left = j*cols + cols + i;
				lower_right = j*cols + cols + i + 1;
				
				
				/*
					Need to fix the UV vectors!
				*/
				geometry.faces.push(new THREE.Face3(lower_left, upper_right, upper_left));	
				geometry.faces.push(new THREE.Face3(lower_left,lower_right,upper_right));
			
			}
		}
	
	}
		
		
	function addNorthSouthWalls(zvalue, geometry, cols, rows, matIndex) {
		var n, vCount;
		n = cols*rows;
		vCount = geometry.vertices.length;
		var nvA, nvB, nvC, nvD;			
		var nFaceA, nFaceB;
		var nLast, nCurrent;
		var northSouthIndices = [];
		
		var svA, svB, svC, svD;
		var sFaceA, sFaceB;
		var sLast, sCurrent;
		
		var reverse = 0;
			
		if (zvalue >= 0) {
			reverse = 1;
		}
		
		for (var i = 0; i < cols; i++) {

			geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[i]).setZ(zvalue)); 
			geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[n-i-1]).setZ(zvalue)); 
			
			nCurrent = vCount;
			sCurrent = vCount +1;
			northSouthIndices.push(nCurrent);
			northSouthIndices.push(sCurrent);
			
			vCount += 2;
			
			var nvA, nvB, nvC, nvD;			
			var nFaceA, nFaceB;
			var nLast, nCurrent;
			var nTemp, sTemp;
			var svA, svB, svC, svD;
			
			
			if (i > 0) {
				
				nvA = i-1;
				nvB = i;
				nvC = nCurrent;
				nvD = nLast;
				
				svA = n-i;
				svB = n-i-1;
				svC = sCurrent;
				svD = sLast;
				
				if(reverse) {
					nTemp = nvA, nvA = nvB, nvB = nTemp;
					nTemp = nvC, nvC = nvD, nvD = nTemp;
					sTemp = svA, svA = svB, svB = sTemp;
					sTemp = svC, svC = svD, svD = sTemp;
				}
				
				nFaceA = new THREE.Face3(nvA, nvB, nvD);
				nFaceB = new THREE.Face3(nvC, nvD, nvB);
				
				nFaceA.materialIndex = matIndex;
				nFaceB.materialIndex = matIndex;

				geometry.faces.push(nFaceA);
				geometry.faces.push(nFaceB);
				
				nFaceA = new THREE.Face3(svA, svB, svD);
				nFaceB = new THREE.Face3(svC, svD, svB);
				
				nFaceA.materialIndex = matIndex;
				nFaceB.materialIndex = matIndex;
				
				geometry.faces.push(nFaceA);
				geometry.faces.push(nFaceB);
				
				
			}
			nLast = nCurrent;
			sLast = sCurrent;
		}
		console.log(northSouthIndices);
			
		return northSouthIndices;
	}
	
	
	function addEastWestWalls(zvalue, geometry, cols, rows, matIndex) {
		var n, vCount;
		n = cols*rows;
		vCount = geometry.vertices.length;
		
		var nvA, nvB, nvC, nvD;			
		var nFaceA, nFaceB;
		var nLast, nCurrent;
		
		var svA, svB, svC, svD;
		var sFaceA, sFaceB;
		var sLast, sCurrent;
		
		var reverse = 0;
		
		if (zvalue >= 0) {
			reverse = 1;
		}
		
		for (var i = 0; i < rows; i ++) {

			geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[n-cols-cols*i]).setZ(zvalue));  //EAST
			geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[cols-1 +cols*i]).setZ(zvalue));  //WEST
			
			nCurrent = vCount;
			sCurrent = vCount +1;
			vCount += 2;
			
			var nvA, nvB, nvC, nvD;			
			var nFaceA, nFaceB;
			var nLast, nCurrent;
			var nTemp, sTemp;
			var svA, svB, svC, svD;
			
			if (i > 0) {
			
				nvA = n-cols*i;
				nvB = n-cols-cols*i;
				nvC = nCurrent;
				nvD = nLast;
				
				svA = cols*i - 1;
				svB = cols-1 +cols*i;
				svC = sCurrent;
				svD = sLast;
				
				if(reverse) {
					nTemp = nvA, nvA = nvB, nvB = nTemp;
					nTemp = nvC, nvC = nvD, nvD = nTemp;
					sTemp = svA, svA = svB, svB = sTemp;
					sTemp = svC, svC = svD, svD = sTemp;
				}
				
				nFaceA = new THREE.Face3(nvA, nvB, nvD);
				nFaceB = new THREE.Face3(nvC, nvD, nvB);
				
				nFaceA.materialIndex = matIndex;
				nFaceB.materialIndex = matIndex;

				geometry.faces.push(nFaceA);
				geometry.faces.push(nFaceB);
				
				nFaceA = new THREE.Face3(svA, svB, svD);
				nFaceB = new THREE.Face3(svC, svD, svB);
				
				nFaceA.materialIndex = matIndex;
				nFaceB.materialIndex = matIndex;
				
				geometry.faces.push(nFaceA);
				geometry.faces.push(nFaceB);
			
			}
			nLast = nCurrent;
			sLast = sCurrent;
		}
		return geometry;
	}

	
	function addLid( zValue, geometry, cols, rows, matIndex) {
		var n = cols*rows;
		var reversed = false;
		var faceA, faceB;
		var vCount = geometry.vertices.length;
		
		geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[0]).setZ(zValue)); //NE
		geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[cols-1]).setZ(zValue)); //NW 
		geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[n-cols]).setZ(zValue));  //SE
		geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[n-1]).setZ(zValue));  //SW
		
		
		if (zValue>0) {
			
			faceA = new THREE.Face3(vCount, vCount+2, vCount+3);
			faceB = new THREE.Face3(vCount, vCount+3, vCount+1);
		} else {
			faceA = new THREE.Face3(vCount,vCount+3, vCount+2 );
			faceB = new THREE.Face3(vCount, vCount+1 , vCount+3);
		}
		faceA.materialIndex = matIndex;
		faceB.materialIndex = matIndex;
		
		geometry.faces.push(faceA);
		geometry.faces.push(faceB);

	}
	
	
	
	function buildOutlineGeometry(zValue, geometry, cols, rows) {
		var waterGeometry = new THREE.Geometry();
		vCount = 0;
		waterGeometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[0]).setZ(zValue)); //NE
		waterGeometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[cols-1]).setZ(zValue)); //NW 
		waterGeometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[rows*cols-cols]).setZ(zValue));  //SE
		waterGeometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[rows*cols-1]).setZ(zValue));  //SW
		
		
		if (zValue>0) {
			faceA = new THREE.Face3(vCount, vCount+2, vCount+3);
			faceB = new THREE.Face3(vCount, vCount+3, vCount+1);
		} else {
			faceA = new THREE.Face3(vCount,vCount+3, vCount+2 );
			faceB = new THREE.Face3(vCount, vCount+1 , vCount+3);
		}
		
		waterGeometry.faces.push(faceA);
		waterGeometry.faces.push(faceB);
		
		return waterGeometry;
	}
	
	
	function buildBaseGeometry(geometry, cols, rows) {
		var waterGeometry = new THREE.Geometry();
		waterGeometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[0]).setZ(zValue)); //NE
		waterGeometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[cols-1]).setZ(zValue)); //NW 
		waterGeometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[rows*cols-cols]).setZ(zValue));  //SE
		waterGeometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[rows*cols-1]).setZ(zValue));  //SW
		
		return baseGeometry;
	}
	
	
	function getBaseGeometry() {
	
	}
	
	
	return {
		loadData : loadData,
		getBaseGeometry : getBaseGeometry
	}
	
		
	})();
