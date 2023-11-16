import React, { useState, useEffect } from 'react'
import MapContext from './MapContext'
import CategoryList from '../Feature/CategoryList.js';
import { getGrade } from '../Feature/GetGrade.js';
import 'ol/ol.css'
import './Map.css'
import { Map as OlMap, View, Feature, Overlay } from 'ol'
import { defaults as defaultControls, FullScreen, ScaleLine, Zoom, ZoomSlider } from 'ol/control'
import { fromLonLat, get as getProjection } from 'ol/proj'
import { Tile as TileLayer, Vector, Marker } from 'ol/layer'
import { XYZ, TileWMS, Vector as VectorWMS } from 'ol/source'
import { Style, Circle, Fill, Stroke, Icon } from 'ol/style'
import { Point, LineString } from 'ol/geom'
import { DragRotateAndZoom, defaults as defaultInteractions} from 'ol/interaction'
import $, { get } from 'jquery';

//import {fetchData} from './FetchData.js';
//FetchData.js - 원하는 데이터 추출 파일 (현재는 return값 지정x)
//fetchData(); - 추출

const safeKey = process.env.REACT_APP_SAFE_KEY;
const mapKey = process.env.REACT_APP_MAP_KEY;

var map;
var currentMarker;	// 현 위치 마커
var currentLoc;	// 현 위치 좌표


function fetchtest(){

  var source = new VectorWMS();
  var layer = new Vector({
    source : source
  });

  var iconStyle = new Style({
    image: new Icon({
      src:'https://map.vworld.kr/images/ol3/marker_blue.png'
    })
  });

const start_x = 14371465.30;
const start_y = 4182016.47;
const arrive_x = 14369631.5;
const arrive_y = 4182198.1;

fetch('https://safewalk-safewalk.koyeb.app/calculate_route', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        start_point: [start_x, start_y],
        arrive_point: [arrive_x, arrive_y]
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log(data.route); 
    for(var i=0; i<(data.route).length; i++){

      var datalists = data.route[i];
  
      if(i===0){
        map.getView().setCenter(fromLonLat([datalists.lon, datalists.lat],getProjection('EPSG:3857')));
        map.getView().setZoom(17);
      }
  
      var marker = new Feature({
        geometry: new Point(fromLonLat([datalists.lon, datalists.lat],getProjection('EPSG:3857'))),
        name: "marker",
      });
      
      marker.setStyle(iconStyle);
      source.addFeature(marker);
    }
  
    map.addLayer(layer);

  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// vector layer

 function route(){
  const coords = [129.101064, 35.1333136, 129.1007941, 35.1332841, 129.0990208, 35.1335472, 129.0987385, 35.1337945, 129.0982911, 35.1341866,129.0981828, 35.1342974, 129.0978824, 35.1346048, 129.0963883, 35.1348433, 129.0955102, 35.1355855, 129.0952774, 35.1355384, 129.0943901, 35.1353587, 129.0941191, 35.1353038, 129.0936896, 35.1352168, 129.0931664, 35.1351874, 129.0918973, 35.1351163, 129.0905529, 35.135029, 129.0893977, 35.1349703, 129.0891596, 35.1349582, 129.0880074, 35.1348997, 129.0869219, 35.1348445, 129.085592, 35.134777, 129.0847848, 35.134736];
  let path = [];
  for(let i = 0; i < coords.length; i+=2) {
   path.push([coords[i], coords[i + 1]]);
 }

 const lineString = new LineString(path);
 lineString.transform('EPSG:4326', 'EPSG:3857');
 const feature = new Feature({
   geometry: lineString
 });
 
 const source = new VectorWMS();
 source.addFeature(feature);
 var vector = new Vector({
   source,
   style: new Style({
     stroke: new Stroke({
       color: 'red',
       width: 3
     })
   })
 })

map.addLayer(vector);


 }

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
  map.addControl(new Zoom());
  getCurrentLocation();
  
  onoffWMS(); // 오동작 방지

  document.getElementById('culocation').addEventListener('click', () => {
    map.getView().setCenter(currentLoc);
    map.getView().setZoom(17);
  });
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

const handleZoomInClick = () => {
  const zoom = map.getView().getZoom() + 1;
  map.getView().setView(zoom);
};

const handleZoomOutClick = () => {
  const zoom = map.getView().getZoom() - 1;
  map.getView().setView(zoom);
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
        name: "CurrentLocation",
      });
      
      currentMarker.setStyle(iconStyle);

      var vectorLayer = new Vector({
        source: new VectorWMS({
          features: [currentMarker]
        })
      });
      vectorLayer.setZIndex(10);

      map.addLayer(vectorLayer);	// 현위치 마커
      map.getView().setCenter(currentLoc); // 현재 위치로 지도 중심 업데이트
      
    } else {
      currentMarker.getGeometry().setCoordinates(currentLoc);	// 마커 위치 업데이트
    }
}

// 4. 레이어 onoff
function onoffWMS(){  
  if(document.querySelector('#switch').checked === true){
    map.addLayer(wmsLayer);
  }else if(document.querySelector('#switch').checked === false){
    map.removeLayer(wmsLayer);
  }
}

// 일정 간격 체크

var grade = null;

// setInterval(() => {
//   grade = getGrade(currentLoc);
//   console.log(grade);
// }, 50000); // 50초
 
function getAddress(){

  $.ajax({  // ADDRESS 
        url: "https://api.vworld.kr/req/search?",
        type: "GET",
        dataType: "jsonp",
        data: {
          service: "search",
          request: "search",
          version: "2.0",
          crs: "EPSG:900913",
          bbox: "14300071.146077,4160339.6527027,14450071.146077,4210339.6527027",
          size: "20",
          page: "1",
          query: document.getElementById('searchInput').value,
          type: "place",
          format: "json",
          errorformat: "json",
          key: mapKey
        },
        success: function (data){
      getLayer(data);
    }
});
}

function getLayer (data) {
  
  var iconStyle = new Style({
    image: new Icon({
      src:'https://map.vworld.kr/images/ol3/marker_blue.png'
    })
  });
  // var iconStyle = new Style({
  //   image: new Circle({
  //     radius: 6,
  //     fill: new Fill({color: 'blue'}),
  //     stroke: new Stroke({color: 'white', width: 3})
  //   })
  // });
  // searchMarker.setStyle(iconStyle);

  var srchSource = new VectorWMS();
  var srchLayer = new Vector({
    source : srchSource
  });

  if(data.response.status === "NOT_FOUND"){
    // 빈 곳 처리
    // 1. 결과
  }else{
    // 함수 처리
    // 1. 마커
    // 2. 결과
    console.log(data);
    for(var i=0; i<(data.response.result.items).length; i++){

      var datalists = data.response.result.items[i];

      if(i===0){
        map.getView().setCenter([datalists.point.x*1, datalists.point.y*1]);
        map.getView().setZoom(17);
      }

      var marker = new Feature({
        geometry: new Point([datalists.point.x, datalists.point.y]),
        name: "searchedLocation",
        title: datalists.title,
        content: datalists.address.road ? datalists.address.road : datalists.address.parcel,  // 도로명 주소가 있으면 road, 없으면 parcel
      });
      
      marker.setStyle(iconStyle);
      srchSource.addFeature(marker);
    }

    srchLayer.setZIndex(15);
    map.addLayer(srchLayer);

    var popup = new Overlay({ 
      element: document.getElementById('popup'),
      positioning: 'bottom-center',
      stopEvent: true,
      offset: [0, 0],
    }); 
  
    map.addOverlay(popup);

    function event(evt){

      // 클릭된 위치에서 마커 찾기
      var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
        return feature;
      });

      if(feature){
        var coordinates = feature.getGeometry().getCoordinates();
    
        var title = feature.get('title');
        var content = feature.get('content');

        document.querySelector('#content1').textContent = title;
        document.querySelector('#content2').textContent = content;
        popup.setPosition(coordinates);

        console.log(document.getElementById('popup-content'));


      }else{  
        // 마커 밖을 선택하면 레이어 삭제
        popup.setPosition(undefined);
        map.removeLayer(srchLayer);
        map.un('singleclick', event); // 다른 함수 호출에 이벤트 중복 방지
      }
    }
    
    map.on('singleclick', event);
  } 
}

function openMenu() {
  document.querySelector('.sidebar').style.width = "250px";
  document.querySelector('.openbtn').style.display = 'none';
}

function closeMenu() { 
  document.querySelector('.sidebar').style.width = "0";
  document.querySelector('.openbtn').style.display = 'block';
}

const Map = ({ children }) => {
  const [mapObj, setMapObj] = useState({})


  useEffect(() => { 
    //Map 객체 생성 및 vworld 지도 설정

    initMap();

    //route();
    //fetchtest();
    
    // $.ajax({ 값 하나
    //       url: "https://api.vworld.kr/req/address?",
    //       type: "GET",
    //       dataType: "jsonp",
    //       data: {
    //         service: "address",
    //         request: "GetCoord",
    //         version: "2.0",
    //         crs: "EPSG:4326",
    //         type: "ROAD",
    //         address: "오설록",
    //         format: "json",
    //         errorformat: "json",
    //         key: mapKey
    //       },
    //       success: function (result) {
    //         console.log(result);
    //       }
    //     })

    // $.ajax({  // ADDRESS
    //       url: "https://api.vworld.kr/req/search?",
    //       type: "GET",
    //       dataType: "jsonp",
    //       data: {
    //         service: "search",
    //         request: "search",
    //         version: "2.0",
    //         crs: "EPSG:900913",
    //         bbox: "14300071.146077,4160339.6527027,14450071.146077,4210339.6527027",
    //         size: "10",
    //         page: "1",
    //         query: "해운대로",
    //         type: "address",
    //         category: "road",
    //         format: "json",
    //         errorformat: "json",
    //         key: mapKey
    //       },
    //       success: function (result) {
    //         console.log(result);
    //       }
    //     })

    // $.ajax({
    //         url: "https://map.vworld.kr/search.do?",
    //         type: "GET",
    //         dataType: "jsonp",
    //         data:{
    //         category:"poi",
    //         q:"푸라닭",
    //         pageunit: "200",
    //         output:'json',
    //         pageindex:'50',
    //         apiKey: mapKey,
    //         },
    //     success: function (result) {
    //           console.log(result);
    //         }
    //       })
      
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
  <>
  <div className="sidebar">
  <a className="closebtn" onClick={closeMenu}>×</a>
  <a href="#">알림</a>
</div>
  <div className='container'> 
      <nav>
        <div className="nav-container">
        <button className="openbtn" onClick={openMenu}>☰</button>
          <div className="search-container">
            <input type="text" id="searchInput" placeholder="주소 검색..." />
            <button id="searchBtn" onClick={getAddress}>검색</button>
          </div>
          <button className="nav-safe">안전<br />길찾기</button>
        </div>
      </nav>

      <main>
        <div className="switch_wrapper">
          <input type="checkbox" id="switch" className="chkbox" onChange={onoffWMS} defaultChecked={false}/>
          <label htmlFor="switch" className="switch_label">
            <span className="btn"></span>
          </label>
        </div>
        <div id='popup' className='ol-popup'>
          <div id='popup-content' className='ol-popup-content'>
            <h2 id='content1'></h2>
            <p id='content2'></p>
          </div>
        </div>
        <div className="content" style={{width:"100%", height:"100%"}}>
          <MapContext.Provider className="inner" value={mapObj}>
            {children}
          </MapContext.Provider>
        </div>
      <CategoryList></CategoryList>
      </main>
    </div>
    </>
  )
}

export default Map