/*
	XYZ loader. Returns a geometry for a XYZ data input, with dimensions columns * rows (excluding no data pixels, which often present in PostGIS raster output)
	Also needs a WorldReference object, which needs to be updated
*/

var xyzLoader = (function () {

	var minX,maxX;
	var minY,maxY;
	var minZ,maxZ;
	
	var rows, cols;
	
	/* Private functions */
	
	function validatePixel(data,noDataValue) {
		if (data.length != 3) {
			return false;
		} else if (+data[2] <= noDataValue) {
			return false;
		}
		return true;
	}
	
	
	function loadXYZlines(lines,worldReference) {
		
		var scale = worldReference.getScale();
		rows = 0, cols = 0;
		minX = maxX = minY = maxY = minZ = maxZ = null;
		
		for (var i=0; i<lines.length; i++) {
			pixel = lines[i].split(' ');
			if( validatePixel(pixel,-99)) {
			
			
				if(!worldReference.isDefined()) {
					minX = maxX = pixel[0]*scale;
					minY = maxY = pixel[1]*scale;
					minZ = maxZ = 0;
					worldReference.setOffsets(pixel[0], pixel[1], 0);
					
				}
				
				if (pixel[0]*scale == maxX) {
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
		}
		
	}
	
	
	

	/** Builds faces for a raster grid geometry **/	 
	function buildGridFaces(geometry, matIndex) {
		
		var a, b, c, d; //upper left - upper right - lower left - lower right
		var uva, uvb, uvc, uvd;
		geometry.faceVertexUvs[ 0 ] = [];
		
		var faceACB, faceBCD;
		
		for (var i=0; i<cols-1; i++) {
			for (var j=0; j<rows-1; j++) {
			
				a = j*cols + i;
				b = j*cols + i +1;
				c = j*cols + cols + i;
				d = j*cols + cols + i + 1;
				
				/** Building the UV vectors **/
				uva = new THREE.Vector2( i / cols, j / rows );
				uvb = new THREE.Vector2( ( i + 1 ) / cols, j / rows );
				uvd = new THREE.Vector2( ( i + 1 ) / cols, ( j + 1 ) / rows );
				uvc = new THREE.Vector2( i / cols, ( j + 1 ) / rows );
				
				faceACB = new THREE.Face3(a, c, b);
				faceACB.materialIndex = matIndex;
				geometry.faces.push(faceACB);	
				geometry.faceVertexUvs[ 0 ].push( [ uva, uvc, uvb ] );
				
				faceBCD = new THREE.Face3(b, c, d);
				faceBCD.materialIndex = matIndex;
				geometry.faces.push(faceBCD);
				geometry.faceVertexUvs[ 0 ].push( [ uvb, uvc, uvd ] );
				
			}
		}
	
	}
	
	
	
	/** Adding east and west walls to a raster geometry **/
	
	function addEastWestWalls(zvalue, geometry, cols, rows, matIndex, scale) {
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

			geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[n-cols-cols*i]).setZ(zvalue*scale));  //EAST
			geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[cols-1 +cols*i]).setZ(zvalue*scale));  //WEST
			
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
	
	
	function addNorthSouthWalls(zvalue, geometry, cols, rows, matIndex, scale) {
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

			geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[i]).setZ(zvalue*scale)); 
			geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[n-i-1]).setZ(zvalue*scale)); 
			
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
	
	
	
	function addLid( zValue, geometry, cols, rows, matIndex, scale) {
		var n = cols*rows;
		var reversed = false;
		var faceA, faceB;
		var vCount = geometry.vertices.length;
		
		geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[0]).setZ(zValue*scale)); //NE
		geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[cols-1]).setZ(zValue*scale)); //NW 
		geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[n-cols]).setZ(zValue*scale));  //SE
		geometry.vertices.push(new THREE.Vector3().copy(geometry.vertices[n-1]).setZ(zValue*scale));  //SW
		
		
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
	
	
	
	
	/** Public functions **/
	
	function loadData(xyzData, worldReference) {
		var delim = '\n';
		var lines = xyzData.split(delim);
		
		geometry = new THREE.Geometry();
		
		loadXYZlines(lines,worldReference);
		buildGridFaces(geometry);
		
		addEastWestWalls(-200, geometry, cols, rows, 0, worldReference.getScale());
		addNorthSouthWalls(-200, geometry, cols, rows, 0, worldReference.getScale());
		addLid(-200, geometry, cols, rows, 0, worldReference.getScale());
		
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();
		return geometry;
	}
	
	
	return {
		loadData : loadData
	}
	
		
	})();
