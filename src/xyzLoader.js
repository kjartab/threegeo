/*
	XYZ loader. Returns a geometry for a XYZ data input
	Also needs a WorldReference object, which needs to be updated

*/

var xyzLoader = (function () {

	/* Bounding box */
	var minX,maxX;
	var minY,maxY;
	var minZ,maxZ;
	
	var geometry;
	var rows = 0;
	var cols = 0;
	var count = 0;
	
	/* Private functions */
	
	function validatePixel(data,noDataValue) {
		if (data.length != 3) {
			console.log('This coordinate set did not have 3 coordinates');
			return false;
		} else if (+data[2] <= noDataValue) {
			console.log('No data value' + data[2] + ' at point number' + count + '. X cordinate: ' + data[0] + ', Y coordinate: ' + data[1]);
			return false;
		}
		return true;
	}
	
	
	function loadXYZlines(lines,scale) {
	
		for (var i=0; i<lines.length; i++) {
			pixel = lines[i].split(' ');
			if( validatePixel(pixel,-9999)) {
			
			
				if(!minX) {
					minX = maxX = pixel[0]/scale;
					minY = maxY = pixel[1]/scale;
					minZ = maxZ = pixel[2]/scale;
				}
				
				if (pixel[0]/scale == minX) {
					rows++;
				}
				if(pixel[1]/scale == maxY) {
					cols++;
				}
				
				if(pixel[0]/scale > maxX) {
					maxX = pixel[0]/scale;
				}
				
				if(pixel[0]/scale > maxY) {
					maxY = pixel[1]/scale;
				}
					
				if(pixel[0]/scale > maxZ) {
					maxZ = pixel[2]/scale;
				}
				geometry.vertices.push(new THREE.Vector3(pixel[0]/scale-minX,pixel[1]/scale-minY,pixel[2]/scale-minZ));
			}
			count++;
		}
		
	}
		
	function buildFaces(geometry) {
		
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
	
	/* Public functions */
	
	function loadData(xyzData, scale, isWorldReference, worldReference) {
		var delim = '\n';
		var lines = xyzData.split(delim);
		
		geometry = new THREE.Geometry();
		/*	Need to fix UV mapping!	
			geometry.faceVertexUvs[0] = []; 
		*/
	
		/* Do something else if is not world reference */
		loadXYZlines(lines,scale);
		buildFaces(geometry);
		
		console.log('Xmax, Ymax');
		console.log(maxX*scale);
		console.log(maxY*scale);
		if (isWorldReference) {
			worldReference.setOffsets(maxX*scale, maxY*scale, minZ*scale);
		}
		
		console.log(worldReference.toString());
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();
		
		
		return {geometry, cols, rows};
	}
	
	
	return {
		loadData : loadData
	}
	
		
})();
