var grade = null;

export function getGrade(Loc){
    
    var currentLoc = Loc;
    
    if(currentLoc){	
	    
        var center = currentLoc;
	    var start = [center[0]-74.6837539486587, center[1]-83.64580442244187];		// 좌측 하단 좌표
	    var end = [center[0]+74.6837539486587, center[1]+83.64580442244187];		// 우측 상단 좌표
	    var I = 250;
	    var J = 280;
		
	    function fetchGrade(){      // grade 데이터 구하기

            const url = `https://geo.safemap.go.kr/geoserver/safemap/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&BBOX=${start[0]},${start[1]},${end[0]},${end[1]}&CRS=EPSG:3857&WIDTH=500&HEIGHT=560&LAYERS=A2SM_CRMNLHSPOT_TOT&STYLES=&FORMAT=image/png&QUERY_LAYERS=A2SM_CRMNLHSPOT_TOT&INFO_FORMAT=application/json&I=${I}&J=${J}`;
		    
		    fetch(url)
		    .then((response) => response.json())
		    .then((jsonData) => {
			    grade = jsonData.features[0].properties.GRAD;
		    })
		    .catch((error) => {   // 에러 or 범죄 주의 구간을 벗어난 경우 ( ex. 건물 안)
                //console.log("error: ",error);
                grade = '0';
		    });
	    };
    fetchGrade();
	}	
    return grade;
}