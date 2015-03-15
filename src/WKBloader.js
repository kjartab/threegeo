
	
	function loadLine(data, geometry, worldRef, scale) {
			
			geometryList = [];
			
			byteCount =0;
			var length = new Uint8Array(data).length;
			var dimensions = 2;
			while (byteCount < length) {
			
				var uint8 = new Uint8Array(data.slice(byteCount,byteCount++)); // Endianness
				
				var objecttype = new Uint32Array(data.slice(byteCount,byteCount+=4))[0]; // The Objecttype in code (e.g. 1002 = LineStringZ)
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
					break;
					
					 /* 
						Linestring M - parse
					 */
					case 2002:
					
					break;
						
					/* 
						Linestring ZM  - parse LineString with 4 dimensions; X, Y, Z, M. Add to geometryList
					*/
					case 3002:
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
					
					/* 
						Polygon - parse geometries with 3 dimensions. Add to geometryList
					*/
					case 1003: 
								
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
						
						break;
					
					/*
						MultiPoint - print out number of Points and break
					*/
					case 1004: 
						
						var numLineStrings = new Uint32Array(data.slice(byteCount,byteCount+=4))[0];
						console.log('Points: '  + numLineStrings);
						
						break;
					
					/*
						MultiLinestring -  print out number of LineStrings and break
					*/
					case 3005: 
						
						var lineStringCount = new Uint32Array(data.slice(byteCount,byteCount+=4))[0];
						console.log('MultiLinestring with '  + lineStringCount + ' linestrings');
				
						break;
					
					 /* 
						MultiPolygon - print out number of Polygons and break
					*/
					case 1006:
					
						var polygonCount = new Uint32Array(data.slice(byteCount,byteCount+=4))[0];
						console.log('Multipolygon with '  + polygonCount + ' polygons');
						
						break;
				
					 /* 
						GeometryCollection - print out number of Geometries and break
					 */
					case 1007:
						
						var geometryCount = new Uint32Array(data.slice(byteCount,byteCount+=4))[0]; 
						console.log('GeometryCollection with ' + geometryCount + ' geometries');
					
						break;
					
					
				
				}
				
			}
			
			
		
		var material = new THREE.LineBasicMaterial({color: 0x111111});
		for (var i=0; i<geometryList.length; i++) {
			//var geom = buildLineZm2(geometryList[i]);
			//window.scene.add(geom);
			console.log(geometryList[i]);
			handleLine(translateGeometry(geometryList[i]));
			//window.scene.add(new THREE.Line(geometryList[i],material));
		}
		
	function handleLine(geometry) {
		
		var pointGeom = new THREE.Geometry();
		var res = createStart(geometry.vertices[0],geometry.vertices[1]);
		
		pointGeom.vertices.push(res.starta);
		pointGeom.vertices.push(res.startb);
		
		var PointGeom2 = new THREE.Geometry();
		for (var i =1; i<geometry.vertices.length-2; i++) {
			var res = createCenter(geometry.vertices[i-1], geometry.vertices[i], geometry.vertices[i+1]) 
			PointGeom2.vertices.push(res.nodeC);
			PointGeom2.vertices.push(res.nodeD);
		}
		
		var material2 = new THREE.PointCloudMaterial({
		  color: 0x000088,
		  size: 0.1
		});
		//window.scene.add(new THREE.PointCloud(PointGeom2,material2));
		
		var material1 = new THREE.PointCloudMaterial({
		  color: 0x880000,
		  size: 0.1
		});
		window.scene.add(new THREE.PointCloud(pointGeom,material1));
		
		var material = new THREE.LineBasicMaterial({color: 0x111111});
		bindPolygons(PointGeom2);		
		//window.scene.add(new THREE.Line(geometry,material));
		console.log(window.scene);
		
	}
	
	function bindPolygons(pointgeom) {
		var geometry = new THREE.Geometry();
		geometry.vertices = pointgeom.vertices;
		for (var i=0; i<geometry.vertices.length-4; i++) {
			
			geometry.faces.push(new THREE.Face3(i+1,i+2,i+3));
			geometry.faces.push(new THREE.Face3(i+1,i,i+2));
		}
		geometry.computeFaceNormals();
		var material22 = new THREE.MeshLambertMaterial({wireframe: false, color: 0x232323 , ambient:0x444444, shading: THREE.SmoothShading, vertexColors: false });
		window.scene.add(new THREE.Mesh(geometry,material22));
	}
	
	
	
		
	function translateGeometry(geometry) {
		
		scale = 100;
		for (var i=0; i<geometry.vertices.length; i++) {
			geometry.vertices[i].setX((geometry.vertices[i].x - worldRef.getXoffset())/scale);
			geometry.vertices[i].setY((geometry.vertices[i].y - worldRef.getYoffset())/scale);
			geometry.vertices[i].setZ((geometry.vertices[i].z - worldRef.getZoffset()+5)/scale);
			console.log(geometry.vertices[i]);
		
		}
		return geometry;
	
	}
	
	function createStart(vertice1, vertice2) {
			
			var vec1 = (new THREE.Vector3().copy(vertice2)).sub(vertice1);
			var ortVec1 = (new THREE.Vector3()).set(-vec1.y,vec1.x,0).normalize();
			
			var starta = (new THREE.Vector3().copy(vertice1)).add(ortVec1.setLength(0.1));
			var startb = (new THREE.Vector3().copy(vertice1)).sub(ortVec1.setLength(0.1));
			
			return {starta : starta, startb : startb};
	}
			
			
	
	
	function createCenter(vectorA, vectorB, vectorC) {
		
		
		var vecAb, vecBc, ortVecBc, ortVecAb;
		var joinVector;
		
		vecAb = (new THREE.Vector3().copy(vectorB)).sub(vectorA);
		ortVecAb = (new THREE.Vector3()).set(-vecAb.y,vecAb.x,0).normalize();
		
		vecBc = (new THREE.Vector3().copy(vectorC)).sub(vectorB);
		ortVecBc = (new THREE.Vector3()).set(-vecBc.y,vecBc.x,0).normalize();

		joinVector = (new THREE.Vector3()).copy(ortVecAb).add(ortVecBc).normalize();

		nodeC = (new THREE.Vector3()).copy(vectorB).sub(joinVector.setLength(0.15));
		nodeD = (new THREE.Vector3()).copy(vectorB).add(joinVector.setLength(0.20));
		
		return {nodeC : nodeC, nodeD : nodeD}
	}
	
			
		

	
	function buildLineZm(geometry) {
	
		
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
				
					
					thickLine.faces.push(new THREE.Face3(count,count+1,count+2));
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
	
	
	/*
		Function for adding the two faces of a section of the line (between four vertices on the line)
	*/
	
	function addFaceToLine(lineGeometry, aIndex, bIndex, cIndex, dIndex) {
		var faceCount = lineGeometry.faces.length;
		lineGeometry.faces.push(new THREE.Face3(bIndex, aIndex, cIndex));
		lineGeometry.faces.push(new THREE.Face3(cIndex, dIndex, bIndex));				

		lineGeometry.faces[faceCount].vertexColors[0] = new THREE.Color( 0x0000ff);
		lineGeometry.faces[faceCount].vertexColors[1] = new THREE.Color( 0x0000ff );
		lineGeometry.faces[faceCount].vertexColors[2] = new THREE.Color (0x0000ff);
		
		lineGeometry.faces[faceCount+1].vertexColors[0] = new THREE.Color( 0x0000ff);
		lineGeometry.faces[faceCount+1].vertexColors[1] = new THREE.Color(  0x0000ff);
		lineGeometry.faces[faceCount+1].vertexColors[2] = new THREE.Color(0x0000ff );					
		
		return lineGeometry.faces.length-1;
	}

	
	
	
	
	function getCenterLineVectors2(vectorA, vectorB, vectorC) {

				
		var vecAb, vecBc, ortVecBc, ortVecAb;
		var joinVector;
		
		vecAb = (new THREE.Vector3().copy(vectorB)).sub(vectorA);
		console.log(vecAb);
		ortVecAb = (new THREE.Vector3()).set(-vecAb.y,vecAb.x,0).normalize();
		console.log(ortVecAb);
		vecBc = (new THREE.Vector3().copy(vectorC)).sub(vectorB);
		ortVecBc = (new THREE.Vector3()).set(-vecBc.y,vecBc.x,0).normalize();

		joinVector = ((new THREE.Vector3()).copy(ortVecAb)).add(ortVecBc).normalize();

		nodeC = (new THREE.Vector3()).copy(vectorB).sub(ortVecAb.setLength(0.15));
		nodeD = (new THREE.Vector3()).copy(vectorB).add(ortVecAb.setLength(0.20));
		
		return {nodeC : nodeC, nodeD : nodeD}
	}
	
		
	/*
		This function takes in three vertices and uses them to compute two nodes for the center piece of the 3-node segment of a line
		
		Uses a join vector to compute the "turning vertices" - NEEDS FIX

	*/


	function getCenterLineVectors(vectorA, vectorB, vectorC) {
		
		
		var vecAb, vecBc, ortVecBc, ortVecAb;
		var joinVector;
		
		vecAb = (new THREE.Vector3().copy(vectorB)).sub(vectorA);
		ortVecAb = (new THREE.Vector3()).set(-vecAb.y,vecAb.x,0).normalize();
		
		vecBc = (new THREE.Vector3().copy(vectorC)).sub(vectorB);
		ortVecBc = (new THREE.Vector3()).set(-vecBc.y,vecBc.x,0).normalize();

		joinVector = (new THREE.Vector3()).copy(ortVecAb).add(ortVecBc).normalize();

		nodeC = (new THREE.Vector3()).copy(vectorB).sub(joinVector.setLength(0.15));
		nodeD = (new THREE.Vector3()).copy(vectorB).add(joinVector.setLength(0.20));
		
		return {nodeC : nodeC, nodeD : nodeD}
	}
	
	
	function buildLineZm2(geometry) {
	
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

					vB = (new THREE.Vector3()).copy(geometry.vertices[i]);
					
					if (i==1) {	/* Compute the first two vertices at the beginnging of the linestring */
					
						vA = (new THREE.Vector3()).copy(geometry.vertices[i-1]);
						vecAb = (new THREE.Vector3().copy(vB)).sub(vA);
						ortVecAb = (new THREE.Vector3()).set(-vecAb.y,vecAb.x,0).normalize();
						
						nodeA = (new THREE.Vector3().copy(vA)).add(ortVecAb.setLength(0.05));
						nodeB = (new THREE.Vector3().copy(vA)).add(ortVecAb.setLength(-0.05));
						
						thickLine.vertices.push(nodeA); // 0
						thickLine.vertices.push(nodeB); // 1		
				
					//	geom.vertices.push(nodeA);
						//geom.vertices.push(nodeB);
					
					}
					
					else if (i==n-1){	
						
						vA = (new THREE.Vector3()).copy(geometry.vertices[i-1]);
						vecAb = (new THREE.Vector3().copy(vB)).sub(vA);
						ortVecAb = (new THREE.Vector3()).set(-vecAb.y,vecAb.x,0).normalize();
						
						fA = thickLine.vertices.length-2;
						fB = thickLine.vertices.length-1;
						
						nodeC = (new THREE.Vector3().copy(vB)).add(ortVecAb.setLength(width));
						nodeD = (new THREE.Vector3().copy(vB)).add(ortVecAb.setLength(-width));
						
						fD = thickLine.vertices.push(nodeC)-1; 
						fC = thickLine.vertices.push(nodeD)-1; 
						
						addFaceToLine(thickLine, fA,fB,fC,fD);
						
						//geom.vertices.push(nodeC);
						//geom.vertices.push(nodeD);
						
						
					}  
					
					else if (i>1 && i<n-1) {	/* Compute the join vectors and add the face for i-2 => i-1 */
						
						if (i==2) {
							/* NEED TO PUSH VERTICE 2 AND 3 _ HAS NOT BEEN DONE YET DAMNIT */
							
							vA = (new THREE.Vector3()).copy(geometry.vertices[i-2]);
							vB = (new THREE.Vector3()).copy(geometry.vertices[i-1]);
							vC = (new THREE.Vector3()).copy(geometry.vertices[i]);
							
							var res = getCenterLineVectors2(vA,vB,vC);
							
							fA = 0;
							fB = 2;
							fC = 2; // +1 (or +3 for i = 0
							fD = 3; // +2 (or +4 for i = 0
							
							addFaceToLine(thickLine, fA,fB,fC,fD);
						
							geom.vertices.push(nodeC);
							geom.vertices.push(nodeD);
						}
						
						vA = (new THREE.Vector3()).copy(geometry.vertices[i-1]);
						vB = (new THREE.Vector3()).copy(geometry.vertices[i]);
						vC = (new THREE.Vector3()).copy(geometry.vertices[i+1]);
						
						var res = getCenterLineVectors(vA,vB,vC);
						
						fA = thickLine.vertices.length-2;
						fB = thickLine.vertices.length-1;
						fC = thickLine.vertices.push(res.nodeC)-1; // +1 (or +3 for i = 0
						fD = thickLine.vertices.push(res.nodeD)-1; // +2 (or +4 for i = 0
						
						addFaceToLine(thickLine, fA,fB,fC,fD);
						
							//geom.vertices.push(nodeC);
							//geom.vertices.push(nodeD);
						
						
						
						
					
					}
				
				
				
			
				
			}
			
		//addPoints(geom);
		
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
		var newgeom = new THREE.Geometry();		
		for (var i = 0; i<geometry.vertices.length; i++) {
			if(4%i) {
				newgeom.vertices.push(geometry.vertices[i]);
			
			}
		
		}
		var that = this;
		that.color = color || 0x0000ff;
		var material = new THREE.PointCloudMaterial({
		  color: that.color,
		  size: 0.1
		});
		window.scene.add(new THREE.PointCloud(newgeom,material));
	}


	}

			
			