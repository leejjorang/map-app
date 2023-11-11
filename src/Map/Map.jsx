import React, { useState, useEffect } from 'react'
import MapContext from './MapContext'
import CategoryList from './CategoryList.js';
import 'ol/ol.css'
import './Map.css'
import { Map as OlMap, View, Feature } from 'ol'
import { defaults as defaultControls, FullScreen, ScaleLine } from 'ol/control'
import { fromLonLat, get as getProjection } from 'ol/proj'
import { Tile as TileLayer, Vector } from 'ol/layer'
import { XYZ, TileWMS, Vector as VectorWMS } from 'ol/source'
import { Style, Circle, Fill, Stroke } from 'ol/style'
import { Point } from 'ol/geom'
import {
  DragRotateAndZoom,
  defaults as defaultInteractions,
} from 'ol/interaction'

//import * as FetchData from './FetchData.js';

//FetchData.js - 원하는 데이터 추출 파일 (현재는 return값 지정x)
//FetchData.fetchData(); - 추출

const safeKey = process.env.REACT_APP_SAFE_KEY;
const mapKey = process.env.REACT_APP_MAP_KEY;

var map;
var currentMarker;	// 현 위치 마커
var currentLoc;	// 현 위치 좌표

// 1. wmsLayer - 범죄주의구간

const wmsSource = new TileWMS({
  url: 'https://www.safemap.go.kr/openApiService/wms/getLayerData.do',
  params: {     
    'apikey':`${safeKey}`,
    'layers':'A2SM_CRMNLHSPOT_TOT', 
    'styles':'A2SM_CrmnlHspot_Tot_Tot'},
  transition: 0,
  projection: 'EPSG:4326',
})

const wmsLayer = new TileLayer({
  source: wmsSource })

// 2. 지도 초기 설정 : 화면, 배경지도 + wmsLayer

const view = new View({
  projection: getProjection('EPSG:3857'),   // 경도, 위도는 EPSG:3857
  center: [0.0, 0.0],
  zoom: 17,
})

function initMap(){

  map = new OlMap({
    controls: defaultControls({ zoom: false, rotate: false }).extend([
      new FullScreen(),
    ]),
    interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
    layers: [
      new TileLayer({
        source: new XYZ({
          url: `https://api.vworld.kr/req/wmts/1.0.0/${mapKey}/Base/{z}/{y}/{x}.png`,
        })}),
    ],
    target: 'map',
    view: view,
  })

  map.addControl(new ScaleLine());
  getCurrentLocation();
}

const satelliteMap = new TileLayer({
  name: 'Satellite',
  visible: true,
  source: new XYZ({
    url: `http://api.vworld.kr/req/wmts/1.0.0/${mapKey}/Satellite/{z}/{y}/{x}.jpeg`
  })
});

const handleSatelliteMapButton = () => {
  map.addLayer(satelliteMap);
  // or
  map.removeLayer(satelliteMap)
}

const hybridMap = new TileLayer({
  name: 'Hybrid',
  visible: true,
  source: new XYZ({
    url: `http://api.vworld.kr/req/wmts/1.0.0/${mapKey}/Hybrid/{z}/{y}/{x}.png`
  })
});

const handleHybridButtonClick = () => {
  map.addLayer(hybridMap);
  // or
  map.removeLayer(hybridMap);
};



// 3. 현 위치

function handleError(error){
	console.log("Error: ", error);
}

function getCurrentLocation(){
	if(navigator.geolocation){
		navigator.geolocation.watchPosition(updateMap, handleError, {enableHighAccuracy: true, maximumAge: 10000});
	}else{
		alert("Not supported");
	}
}

function updateMap(position){
	currentLoc = fromLonLat([position.coords.longitude, position.coords.latitude],getProjection('EPSG:3857'));  // 좌표계 변환

    if (!currentMarker) {
      var iconStyle = new Style({
        image: new Circle({
          radius: 6,
          fill: new Fill({color: 'blue'}),
          stroke: new Stroke({color: 'white', width: 3})
        })
      });

      currentMarker = new Feature({
        geometry: new Point(currentLoc),
        name: "CurrentLocation"
      });
      
      currentMarker.setStyle(iconStyle);

      var vectorLayer = new Vector({
        source: new VectorWMS({
          features: [currentMarker]
        })
      });

      map.addLayer(vectorLayer);	// 현위치 마커
      map.getView().setCenter(currentLoc); // 현재 위치로 지도 중심 업데이트
      
    } else {
      currentMarker.getGeometry().setCoordinates(currentLoc);	// 마커 위치 업데이트
    }
}

// 4. 레이어 onoff

var checkNum = 0;

function onoffWMS(){
  if(checkNum % 2 === 0){
    document.getElementById('myRoundButton').innerHTML='<div>off</div>'
    map.addLayer(wmsLayer);
  }else if(checkNum % 2 === 1){
    document.getElementById('myRoundButton').innerHTML='<div>on</div>'
    map.removeLayer(wmsLayer);
  }
  checkNum++;
}


// 일정 간격 체크

var grade = null;

setInterval(function(){
	if(currentLoc){
		
		var center = currentLoc;
		var start = [center[0]-74.6837539486587, center[1]-83.64580442244187];		// 좌측 하단 좌표
		var end = [center[0]+74.6837539486587, center[1]+83.64580442244187];		// 우측 상단 좌표
		var I = 250;
		var J = 280;
		
    // grade 데이터 구하기
		function fetchGrade(){

			const url = `https://geo.safemap.go.kr/geoserver/safemap/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&BBOX=${start[0]},${start[1]},${end[0]},${end[1]}&CRS=EPSG:3857&WIDTH=500&HEIGHT=560&LAYERS=A2SM_CRMNLHSPOT_TOT&STYLES=&FORMAT=image/png&QUERY_LAYERS=A2SM_CRMNLHSPOT_TOT&INFO_FORMAT=application/json&I=${I}&J=${J}`;
			//console.log(url);

			fetch(url)
			.then((response) => response.json())
			.then((jsonData) => {
				//displayData(jsonData);
        grade = jsonData.features[0].properties.GRAD
			})
			.catch((error) => {   // 에러 or 범죄 주의 구간을 벗어난 경우 ( ex. 건물 안)
				// 가장 최근 등급으로 유지하는 코드 필요
        //console.log("error: ",error);
			});
		};

		fetchGrade();
	}
	
}, 5000); // 5초

const Map = ({ children }) => {
  const [mapObj, setMapObj] = useState({})

  useEffect(() => {
    
    //Map 객체 생성 및 vworld 지도 설정
    initMap();
    
    document.getElementById('culocation').addEventListener('click', () => {
      map.getView().setCenter(currentLoc);
      map.getView().setZoom(17);
    });

    /* RN이랑 통신 시 사용
    document.getElementById('button').addEventListener('click', () => {
      const message = {key1:'GRADE', key2:grade};
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    });

    document.getElementById('button2').addEventListener('click', () => {
      const message2 = {key1:'SMS', key2:'SMS'};
      window.ReactNativeWebView.postMessage(JSON.stringify(message2));
    });
  */
    
    setMapObj({ map })
    return () => map.setTarget(undefined) // 렌더링 누적 방지
  }, [])

  return (
  <div className='container'>
      <nav>
        <div className="nav-container">
          <div className="search-container">
            <input type="text" id="searchInput" placeholder="주소 검색..." />
            <button id="searchBtn">검색</button>
          </div>
          <button className="nav-safe">안전<br />길찾기</button>
        </div>
      </nav>

      <main>
        <div className="content" style={{width:"100%", height:"100%"}}>
          <MapContext.Provider className="inner" value={mapObj}>
            {children}
            <button id="myRoundButton" onClick={onoffWMS}>on</button>
          </MapContext.Provider>
        </div>
      <CategoryList></CategoryList>
      </main>
    </div>
  )
}

export default Map