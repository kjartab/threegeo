
	
	function loadWKT(inputString, isEWKT, worldReference) {
			var res;
			if (isEWKT) {
				res = inputString.split(';');
			}
			var srid = res[0];
			
			console.log('LineString has SRID = ' + srid);
			console.log('World reference has SRID =' + worldReference.getSRID());
			
			return 	getLineStringGeometry(res[1]);
			
	}
	
	function strip(inputString, stringArray) {
		return inputString;
	}
	
	
	function getLineStringGeometry(wktString, worldReference) {
		var lineStrings = wktString.split('LINESTRING(')[1];
		
			var geometry = new THREE.Geometry();
			var mValues = [];
			var coordinates = lineStrings.replace(/[{()}]/g, '').split(',');
			var tempCoord,x,y,z,m, dims;
			
			for (var i=0; i<coordinates.length; i++) {
				tempCoord = coordinates[i].split(' ');
				dims = tempCoord.length+1;
				if(dims < 2 || dims > 4) {
					console.log('Dimension error');
					break;	
				}
				
				x = (tempCoord[0]-worldReference.getXoffset())*worldReference.getScale();
				y = (tempCoord[1]-worldReference.getYoffset())*worldReference.getScale();

				if(dims == 3) {
					z = (tempCoord[2]-worldReference.getZoffset())*worldReference.getScale();
					geometry.vertices.push(new THREE.Vector3(x,y,z+5/100));
				} else if (dims==4) {
					m = tempCoord[3];
					z = (tempCoord[2]-worldReference.getZoffset())*worldReference.getScale();
					geometry.vertices.push(new THREE.Vector3(x,y,z+5/100));
					mValues.push(m);
				} else {
					geometry.vertices.push(new THREE.Vector3(x,y,0));
				}
				
			}
		
		return geometry;
		
		
	}
	
	
	function buildLineGeometry() {
	
		
	}	
	
	
	String.prototype.trim = function() {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
