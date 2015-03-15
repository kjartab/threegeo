
	
	function loadLine(data, geometry, worldRef, scale) {
			
			geometryList = [];
			
			byteCount =0;
			var length = new Uint8Array(data).length;
			var dimensions = 2;
			while (byteCount < length) {
			
				var u8 = new Uint8Array(data.slice(byteCount,byteCount++)); // 1 byte for endianness
				
				var objecttype = new Uint32Array(data.slice(byteCount,byteCount+=4))[0]; // objecttype = polygon, geometrycollection etc
				console.log(objecttype);
				
				switch (objecttype) {
					
					case 1001: // Point
					
					break
					
					case 2: // Linestring 2D
						dimensions = 2;
					break;
					
					case 1002: // Linestring Z
						var geometry = new THREE.Geometry();
						var numPoints = new Uint32Array(data.slice(byteCount,byteCount+=4))[0];
						console.log('num points ' + numPoints);
						dimensions = 3;
						var coordinates;
						for (j = 0; j < numPoints; j++) {
							coordinates = new Float64Array(data.slice(byteCount,byteCount+=(dimensions*8)));
							geometry.vertices.push(new THREE.Vector3(coordinates[0],coordinates[1],coordinates[2]));
						}
						geometryList.push(geometry);
						console.log(geometry);
					break;
					
					
					case 2002: /* Linestring M */
					
					break;
						
					
					case 3002: /* Linestring ZM */
						var geometry = new THREE.Geometry();
						var numPoints = new Uint32Array(data.slice(byteCount,byteCount+=4))[0];
						dimensions = 4;
						var coordinates;
						for (j = 0; j < numPoints; j++) {
							coordinates = new Float64Array(data.slice(byteCount,byteCount+=(dimensions*8)));
							geometry.vertices.push(new THREE.Vector3(coordinates[0],coordinates[1],coordinates[2]));
						}
						geometryList.push(geometry);
					
					break;
					
					case 1003: /* Polygon */
								
						var rings = new Uint32Array(data.slice(byteCount,byteCount+=4))[0];
						
						dimensions = 3;
						
						for (var i = 0; i < rings; i++) { 
							
							var numPoints = new Uint32Array(data.slice(byteCount,byteCount+=4))[0];
							for (j = 0; j<numPoints; j++) {
								var coordinates = new Float64Array(data.slice(byteCount,byteCount+=(dimensions*8)));
								if(j!=numPoints-1) {
									geometry.vertices.push(new THREE.Vector3(coordinates[0],coordinates[1],coordinates[2]));
								}
							}
							geometry.faces.push(new THREE.Face3(geometry.vertices.length-3,geometry.vertices.length-2,geometry.vertices.length-1));
						}
					
					case 1004: // Multipoint
						
						var numLineStrings = new Uint32Array(data.slice(byteCount,byteCount+=4))[0];
						console.log('Points: '  + numLineStrings);
						
					break;
					
					case 3005: // MultiLinestring
						
						var numLineStrings = new Uint32Array(data.slice(byteCount,byteCount+=4))[0];
						console.log('MultiLinestring with '  + numLineStrings+ ' linestrings');
						
					break;
					
					case 1006: /* MultiPolygon */
						var numLineStrings = new Uint32Array(data.slice(byteCount,byteCount+=4))[0];
						console.log('Multipolygon with '  + numLineStrings + ' polygons');
					break;
				
					case 1007: /* GeometryCollection */
						
						var numGeom = new Uint32Array(data.slice(byteCount,byteCount+=4))[0]; // 4 x 2 bytes
				
						console.log('GeometryCollection with ' + numGeom + ' geometries');
					
					break;
					
					
				
				}
				
			}
			
		console.log(geometryList);
		
		var material = new THREE.LineBasicMaterial({color: 0x111111});
		for (var i=0; i<geometryList.length; i++) {
			var geom = buildLineZm2(geometryList[i]);
			window.scene.add(geom);
			console.log(geom);
			window.scene.add(new THREE.Line(geometryList[i],material));
		}
	
	function buildLineZm(geometry) {
		console.log(geometry);
		
		var material = new THREE.LineBasicMaterial({
			color: 0x0000ff,
			lineWidth: 0.5
		});

		var fcount = 0;
		var colors = [];
		var thickLine = new THREE.Geometry();
		if(geometry.vertices.length>=2) {
			
			var width = 20/100;
			var count = 0;
			for (var i=0; i<geometry.vertices.length; i++) {
				geometry.vertices[i].setX((geometry.vertices[i].x - worldRef.getXoffset())/scale);
				geometry.vertices[i].setY((geometry.vertices[i].y - worldRef.getYoffset())/scale);
				geometry.vertices[i].setZ((geometry.vertices[i].z - worldRef.getZoffset())/scale);
				
				
				if(i>0) {
				var vertice1 = (new THREE.Vector3()).copy(geometry.vertices[i-1]);
				
				var vertice2 = (new THREE.Vector3()).copy(geometry.vertices[i]);
				
				var vec1 = (new THREE.Vector3().copy(vertice2)).sub(vertice1);
				
				
				var ortVec1 = (new THREE.Vector3()).set(-vec1.y,vec1.x,0).normalize();
				
				

				var starta = (new THREE.Vector3().copy(vertice1)).add(ortVec1.setLength(width));
				var startb = (new THREE.Vector3().copy(vertice1)).add(ortVec1.setLength(-width));
				var enda = (new THREE.Vector3().copy(vertice2)).add(ortVec1.setLength(width));
				var endb = (new THREE.Vector3().copy(vertice2)).add(ortVec1.setLength(-width));
				

					color = new THREE.Color( 0xffffff );
					color.setHSL( ( 1 ) / 2, 1.0, 0.5 );
			
				
				thickLine.faces.push(new THREE.Face3(count,count+1,count+2,count+3));
				thickLine.faces.push(new THREE.Face3(count,count+2,count+3));
				
			
				thickLine.faces[fcount].vertexColors[0] = new THREE.Color( 0x3333ff );
				thickLine.faces[fcount].vertexColors[1] = new THREE.Color( 0x3333ff );
				thickLine.faces[fcount].vertexColors[2] = new THREE.Color( 0xccccff );
				
				thickLine.faces[fcount+1].vertexColors[0] = new THREE.Color( 0x3333ff );
				thickLine.faces[fcount+1].vertexColors[1] = new THREE.Color( 0xccccff);
				thickLine.faces[fcount+1].vertexColors[2] = new THREE.Color( 0xccccff );
					fcount +=2;
				count += 4;

				thickLine.vertices.push(starta);
				
				thickLine.vertices.push(startb);
				thickLine.vertices.push(enda);
				thickLine.vertices.push(endb);
				
				}
				
			}
			thickLine.colors = colors;
			thickLine.computeFaceNormals();
			thickLine.computeVertexNormals();
			
		thickLine.colorsNeedUpdate = true;
		
		}
		
		
		
		var material = new THREE.MeshBasicMaterial( {color: 0xcccccc, shading: THREE.FlatShading, vertexColors: THREE.VertexColors} );
		var mesh = new THREE.Mesh(thickLine,material);
		
		return mesh;
	}
	
	
	function buildLineZm2(geometry) {
		console.log(geometry);
			addPoints(geometry, 0x00ff00);
		
		var material = new THREE.LineBasicMaterial({
			color: 0x0000ff,
			lineWidth: 0.5
		});
			var geom = new THREE.Geometry();
		var fA, fB, fC, fD;
		var vA, vB, vC;
		var vecAb, vecBc, ortVecBc, ortVecAb;
		var fcount = 0;
		var colors = [];
		var vecJoin;
		var thickLine = new THREE.Geometry();
		if(geometry.vertices.length>=2) {
			
			var width = 1/100;
			var count = 0;
			var n = geometry.vertices.length;
			var faceA, faceB, faceC, faceD; 
			for (var i=0; i<n; i++) {
				geometry.vertices[i].setX((geometry.vertices[i].x - worldRef.getXoffset())/scale);
				geometry.vertices[i].setY((geometry.vertices[i].y - worldRef.getYoffset())/scale);
				geometry.vertices[i].setZ((geometry.vertices[i].z - worldRef.getZoffset()+5)/scale);
				//console.log(geometry.vertices[i]);
				
					vB = (new THREE.Vector3()).copy(geometry.vertices[i]);
					
					
					
					if (i==1) {
						console.log('i == 1');
						console.log(geometry.vertices[i]);
						vA = (new THREE.Vector3()).copy(geometry.vertices[i-1]);
						vecAb = (new THREE.Vector3().copy(vB)).sub(vA);
						ortVecAb = (new THREE.Vector3()).set(-vecAb.y,vecAb.x,0).normalize();
						
						nodeA = (new THREE.Vector3().copy(vA)).add(ortVecAb.setLength(width));
						nodeB = (new THREE.Vector3().copy(vA)).add(ortVecAb.setLength(-width));
						thickLine.vertices.push(nodeA); // +1
						thickLine.vertices.push(nodeB); // +2
						


					} else if (i==n-2){	
						console.log(i);
						console.log('i == n-2');
						console.log(geometry.vertices[i]);
						vC = (new THREE.Vector3()).copy(geometry.vertices[i+1]);
						vecBc = (new THREE.Vector3().copy(vC)).sub(vB);
						ortVecBc = (new THREE.Vector3()).set(-vecBc.y,vecBc.x,0).normalize();
						
						nodeC = (new THREE.Vector3().copy(vC)).add(ortVecBc.setLength(width));
						nodeD = (new THREE.Vector3().copy(vC)).add(ortVecBc.setLength(-width));
						thickLine.vertices.push(nodeC); // +1
						thickLine.vertices.push(nodeD); // +2
						
					}  else if (i>1 && i<n-2) {
					
						vecAb = (new THREE.Vector3().copy(vB)).sub(vA);
						vA = (new THREE.Vector3()).copy(geometry.vertices[i-1]);
						ortVecAb = (new THREE.Vector3()).set(-vecAb.y,vecAb.x,0).normalize();
						
						vC = (new THREE.Vector3()).copy(geometry.vertices[i+1]);
						vecBc = (new THREE.Vector3().copy(vC)).sub(vB);
						ortVecBc = (new THREE.Vector3()).set(-vecBc.y,vecBc.x,0).normalize();
					
						vecJoin = (new THREE.Vector3()).copy(ortVecAb).add(ortVecBc).normalize();
					
					
						nodeC = (new THREE.Vector3()).copy(vB).sub(vecJoin.setLength(0.05));
						nodeD = (new THREE.Vector3()).copy(vB).add(vecJoin.setLength(0.05));
						
						
						if (i==n-2) {
						fA = thickLine.vertices.length+1;
						fB = thickLine.vertices.length+2;
						
						} else {
						fA = thickLine.vertices.length-2;
						fB = thickLine.vertices.length-1;
						
						}
						fC = thickLine.vertices.push(nodeC)-1; // +1 (or +3 for i = 0
						fD = thickLine.vertices.push(nodeD)-1; // +2 (or +4 for i = 0
						geom.vertices.push(nodeC);
						geom.vertices.push(nodeD);
						
						thickLine.faces.push(new THREE.Face3(fB, fA, fC));
						thickLine.faces.push(new THREE.Face3(fC, fD, fB));				

						thickLine.faces[fcount].vertexColors[0] = new THREE.Color( 0x0000ff);
						thickLine.faces[fcount].vertexColors[1] = new THREE.Color( 0x0000ff );
						thickLine.faces[fcount].vertexColors[2] = new THREE.Color (0x0000ff);
						
						thickLine.faces[fcount+1].vertexColors[0] = new THREE.Color( 0x0000ff);
						thickLine.faces[fcount+1].vertexColors[1] = new THREE.Color(  0x0000ff);
						thickLine.faces[fcount+1].vertexColors[2] = new THREE.Color(0x0000ff );					
							
						
						fcount +=2;
					
						
					
					
					}
				
				
				
			
				
			}
			
		addPoints(geom);
			thickLine.colors = colors;
				thickLine.computeFaceNormals();
				thickLine.computeVertexNormals();
			
		thickLine.colorsNeedUpdate = true;
		
		}
		
		
		
		var material = new THREE.MeshBasicMaterial( {wireframe: true, color: 0xcccccc, shading: THREE.FlatShading, vertexColors: THREE.VertexColors} );
		var mesh = new THREE.Mesh(thickLine,material);
		
		return mesh;
	}
	
	
	
	function addPoints(geometry, color) {
		var that = this;
		that.color = color || 0x0000ff;
		var material = new THREE.PointCloudMaterial({
		  color: that.color,
		  size: 0.1
		});
		window.scene.add(new THREE.PointCloud(geometry,material));
	}


	}
	
	function iterationColour(number) {
		
	}
	
			
			