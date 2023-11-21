import React, { useState, useEffect } from 'react'
import MapContext from './MapContext'
import CategoryList from '../Feature/CategoryList.js';
import { getGrade } from '../Feature/GetGrade.js';
import 'ol/ol.css'
import './Map.css'
import { Map as OlMap, View, Feature, Overlay } from 'ol'
import { defaults as defaultControls, FullScreen, ScaleLine, Zoom } from 'ol/control'
import { fromLonLat, get as getProjection } from 'ol/proj'
import { Tile as TileLayer, Vector, Marker } from 'ol/layer'
import { XYZ, TileWMS, Vector as VectorWMS } from 'ol/source'
import { Style, Circle, Fill, Stroke, Icon } from 'ol/style'
import { Point, LineString } from 'ol/geom'
import { DragRotateAndZoom, defaults as defaultInteractions} from 'ol/interaction'
import $ from 'jquery';

const safeKey = process.env.REACT_APP_SAFE_KEY;
const mapKey = process.env.REACT_APP_MAP_KEY;

export let map;
 let currentMarker;	// 현 위치 마커
export let currentLoc;	// 현 위치 좌표
let grade = null;

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

export const wmsLayer = new TileLayer({
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
  
  document.getElementById('culocation').addEventListener('click', () => {
    map.getView().setCenter(currentLoc);
    map.getView().setZoom(17);
  });
}

// 3. 현 위치

function handleError(error){
	console.log("Error: ", error);
}

function updateMap(position){
	currentLoc = fromLonLat([position.coords.longitude, position.coords.latitude],getProjection('EPSG:3857'));  // 좌표계 변환

    if (!currentMarker) {
      var iconStyle = new Style({
        image: new Icon({
          src : process.env.PUBLIC_URL + '/pin_mark_pink.png',
          scale : 0.07,
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

function getCurrentLocation(){
	if(navigator.geolocation){
		navigator.geolocation.watchPosition(updateMap, handleError, {enableHighAccuracy: true, maximumAge: 10000});
	}else{
		alert("Not supported");
	}
}

  // 4. 레이어 onoff
  const onoffWMS = () => {    
    if(document.querySelector('#switch').checked === true){
      map.addLayer(wmsLayer);
    }else if(document.querySelector('#switch').checked === false){
      map.removeLayer(wmsLayer);
    }
  }

  // 5. 경로
  
  let sttPoint, dstPoint;

  function fetchtest(sttPoint, dstPoint){

    const dstSource = new VectorWMS();
    let dstLayer = new Vector({
      source : dstSource,
      name : 'dstLayer'
    });

  const start_x = parseFloat(sttPoint.x); 
  const start_y = parseFloat(sttPoint.y);
  const arrive_x = parseFloat(dstPoint.x);
  const arrive_y = parseFloat(dstPoint.y);
  
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
  
      const coords = [];
  
      for(var i=0; i<(data.route).length; i++){
  
        var datalists = data.route[i];
        
        coords.push(datalists.X, datalists.Y);
  
        if(i===0){
          map.getView().setCenter([datalists.X, datalists.Y]);
          map.getView().setZoom(17);
        }
      }
  
      let dstIconStyle = new Style({
        image: new Icon({
          src : process.env.PUBLIC_URL + '/pin_mark.png',
          scale : 0.07,
        })
      });
    
      let dstMarker = new Feature({
        geometry: new Point([data.route[(data.route.length-1)].X, data.route[(data.route.length-1)].Y]),
        name: "destination",
      });
    
      let srcIconStyle= new Style({
        image: new Icon({
          src : process.env.PUBLIC_URL + '/pin_mark.png',
          scale : 0.07,
        })
      });
    
      let srcMarker = new Feature({
        geometry: new Point([data.route[0].X, data.route[1].Y]),
        name: "source",
      });
  
    let path = [];
    for(let i = 0; i < coords.length; i+=2) {
    path.push([coords[i], coords[i + 1]]);
    }
  
    const lineString = new LineString(path);
    const feature = new Feature({
      geometry: lineString
    });

    feature.setStyle(new Style({
      stroke: new Stroke({
        color: [86, 137, 214, 0.9],    //#5689d6
        width: 10,
        lineCap: 'round',
        lineJoin: 'round',
      })
    }))

    dstMarker.setStyle(dstIconStyle);
    srcMarker.setStyle(srcIconStyle);
    dstSource.addFeature(dstMarker);
    dstSource.addFeature(srcMarker);
    dstSource.addFeature(feature);
    
    dstLayer.setZIndex(2);
    map.addLayer(dstLayer);
  
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }


const Map = ({ children }) => {
  const [mapObj, setMapObj] = useState({});
  const [srchLayer, setSrchLayer] = useState(null);

  // 검색바 표시 상태
  const [showSearchBars, setShowSearchBars] = useState(false);

  const handleSafeRouteClick = () => {
    setShowSearchBars(!showSearchBars); // 상태 토글
  };

  useEffect(() => { 
    //Map 객체 생성 및 vworld 지도 설정

    initMap();
    onoffWMS(); 

    //route();
    //fetchtest();
    
    setMapObj({ map })  
    return () => map.setTarget(undefined) // 렌더링 누적 방지 
  }, [])

  const [searchResults, setSearchResults] = useState([]); // 검색 결과를 저장할 state
  const [searchTerm, setSearchTerm] = useState(""); // 사용자 입력 값을 저장할 state
  const [showSearchResults, setShowSearchResults] = useState(false);

  // 검색 결과를 처리하는 함수
  const handleSearchResults = (data) => {
    if (data.response.status !== "NOT_FOUND" && data.response.result) {
      setSearchResults(data.response.result.items); // 검색 결과를 state에 저장
      setShowSearchResults(true); // 검색 결과 창 표시
    } else {
      setSearchResults([]); // 결과가 없으면 빈 배열로 설정
      setShowSearchResults(false); // 검색 결과 창 숨김
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("#searchResults")) {
        setShowSearchResults(false);
      }
  }
  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  // 검색창에 입력할 때 호출될 함수
  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm); // 사용자 입력값을 state에 저장

    if (newSearchTerm.length > 2) {
      // 최소 글자 수를 기준으로 검색 시작
      getAddress(newSearchTerm, handleSearchResults); // 검색 함수 호출
    } else {
      setSearchResults([]); // 글자 수가 부족하면 결과를 비움
    }
  };

  // 검색 API 호출 함수 수정
  const getAddress = (query, callback) => {
    // API 호출
    $.ajax({
      url: "https://api.vworld.kr/req/search?",
      type: "GET",
      dataType: "jsonp",
      data: {
        service: "search",
        request: "search",
        version: "2.0",
        crs: "EPSG:900913",
        size: "20",
        page: "1",
        query: query, // 사용자 입력을 query로 사용
        type: "place",
        format: "json",
        errorformat: "json",
        key: mapKey,
      },
      success: function (data) {
        callback(data); // 콜백 함수를 통해 결과 처리
      },
    });
  };

  function getLayer (data) {
      
    var iconStyle = new Style({
      image: new Icon({
        src : process.env.PUBLIC_URL + '/pin_mark.png',
        scale : 0.07,
      })
    });

    var srchSource = new VectorWMS();
    var srchLayer = new Vector({
      source : srchSource,
      name : 'searchLayer',
    });

    if(data.response.status === "NOT_FOUND"){
      return;
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
        element: document.querySelector('.ol-popup'),
        positioning: 'bottom-center',
        stopEvent: false, 
        offset: [0, 0],
        name: 'popup',
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

          console.log(document.querySelector('.popup-content')); 

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

  // 검색 결과 중 하나를 클릭했을 때 호출될 함수
  const handleResultSelect = (item) => {
    map.getLayers().forEach(layer => {
      if (layer.get('name') === 'searchLayer') {
        map.removeLayer(layer);
      }
      if (layer.get('name') === 'popup') {
        map.removeLayer(layer);
      }
      if (layer.get('name') === 'dstLayer') {
        map.removeLayer(layer);
      }
    });
    const coords = ([parseFloat(item.point.x),parseFloat(item.point.y)]);
    map.getView().setCenter(coords);
    map.getView().setZoom(17);
    setSearchResults([]); // 선택 후 검색 결과 비우기
    setSearchTerm(item.title); // 검색창에 선택된 주소 표시
  };

  useEffect(() =>{
    
    function srchLayer(){

      map.getLayers().forEach(layer => {
        if (layer.get('name') === 'searchLayer') {
          map.removeLayer(layer);
        }
      });
      
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
          const layer = getLayer(data);
          setSrchLayer(layer);
        }
    });   
    }
        const searchBtn = document.getElementById('searchBtn');
        
        if(searchBtn){  
          searchBtn.addEventListener('click', srchLayer);
        }

        return() => {
          if(searchBtn){
            searchBtn.removeEventListener('click', srchLayer);
          }
          if(srchLayer){
            map.removeLayer(srchLayer);
          }
        }
      }, [srchLayer]);

   // 알림설정 드롭다운 상태
   const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
   useState(false);

 // 드롭다운 메뉴 토글 함수
 const toggleNotificationDropdown = (event) => {
   event.preventDefault(); // 이벤트 버블링 방지
   setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
 };

 // 라디오 버튼 상태 (선택된 옵션)
 const [selectedGrade, setSelectedGrade] = useState('0');
 const [prevGrade, setPrevGrade] = useState(null);

 // 라디오 버튼 변경 핸들러
 const handleRadioChange = (event) => {
   setSelectedGrade(event.target.value);
 };

 useEffect(() => {

  let interCheck;

  if(selectedGrade>0 && selectedGrade !== '0'){  // 확인 후 변경 (값을 선택 + 알림 안 받음 선택 default를 알림 안 받음으로 선택 후 수정)
    interCheck = setInterval(() => {
    grade =  (getGrade(currentLoc)-1);   //Math.floor(Math.random()*2 )+3; 3or4
    setPrevGrade(grade);
    if(selectedGrade > 0 && selectedGrade < grade && prevGrade !== grade){
      console.log('알림 실행 : 사용자가 선택 + 선택 값보다 큰 등급 + 등급의 변화 ');
      const message = {key1:'NOTIFICATION', key2:`${grade}`};
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }}, 3000)};

  return() => {
    clearInterval(interCheck);    // 언마운트 시 메모리 누수 방지
  }
},[selectedGrade, prevGrade]);

// 출발지와 도착지 주소 검색을 위한 상태
const [startAddress, setStartAddress] = useState("");
const [endAddress, setEndAddress] = useState("");
const [startSuggestions, setStartSuggestions] = useState([]);
const [endSuggestions, setEndSuggestions] = useState([]);

// 주소 검색 함수
const searchAddress = async (address, type) => {
  try {
    const response = await $.ajax({
      url: "https://api.vworld.kr/req/search?",
      type: "GET",
      dataType: "jsonp",
      data: {
        service: "search",
        request: "search",
        version: "2.0",
        crs: "EPSG:900913",
        size: "20",
        page: "1",
        query: address,
        type: "place",
        format: "json",
        errorformat: "json",
        key: mapKey,
      },
    });

    if (response.response.result && response.response.result.items) {
      if (type === "start") {
        setStartSuggestions(response.response.result.items);
      } else {
        setEndSuggestions(response.response.result.items);
      }
    } else {
      console.log("검색 결과가 없습니다.");
      // 검색 결과가 없는 경우에 대한 처리
    }
  } catch (error) {
    console.error("검색 중 오류 발생:", error);
    // 오류 처리
  }
};

// 출발지와 도착지 입력란 변경 핸들러
const handleAddressChange = (value, type) => {
  if (type === "start") {
    setStartAddress(value);
    searchAddress(value, type);
  } else {
    setEndAddress(value);
    searchAddress(value, type);
  }
};

return (
  <div className="container">
    <nav>
      <div className="nav-container">
        <div className="search-container">
        <div id="popup" className="ol-popup">
            <div id="popup-content" className="ol-popup-content">
              <h2 id='content1'></h2>
              <p id='content2'></p>
              </div>
            </div>
            <input
              type="text"
              id="searchInput"
              placeholder="주소 검색..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {/* 검색 버튼은 입력 필드와 연결된 함수를 트리거하기 위해 남겨둘 수 있습니다. */}
            <button
              id="searchBtn"
              onClick={() => getAddress(searchTerm, handleSearchResults)}
            >
              검색
            </button>
            {showSearchResults && searchResults.length > 0 && (
              <ul id="searchResults">
                {searchResults.map((item, index) => (
                  <li key={index} onClick={() => handleResultSelect(item)}>
                    {item.title} ({item.address.road})
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button className="nav-safe" onClick={handleSafeRouteClick}>
          안전
          <br />
          길찾기
        </button>
      </div>
    </nav>

    <main>
      <div className="content" style={{ width: "100%", height: "100%" }}>
        <MapContext.Provider className="inner" value={mapObj}>
          {children}

          {/* 검색바 조건부 렌더링 - 지도 내부로 이동 */}
          {showSearchBars && (
              <div className="search-bar-container">
                {/* 출발지 검색바 */}
                <div className="search-bar">
                  <input
                    type="text"
                    value={startAddress}
                    onChange={(e) =>
                      handleAddressChange(e.target.value, "start")
                    }
                    placeholder="출발지"
                  />
                  <div className="autocomplete-container">
                    {startSuggestions.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setStartAddress(item.address.road);
                          sttPoint = item.point;
                          setStartSuggestions([]);
                        }}
                      >
                        {item.address.road}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 도착지 검색바 */}
                <div className="search-bar">
                  <input
                    type="text"
                    value={endAddress}
                    onChange={(e) => handleAddressChange(e.target.value, "end")}
                    placeholder="도착지"
                  />
                  <div className="autocomplete-container">
                    {endSuggestions.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setEndAddress(item.address.road);
                          dstPoint = item.point;
                          setEndSuggestions([]);
                        }}
                      >
                        {item.address.road}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 검색 버튼 */}
                <div className='button-container'>
                <button
                  onClick={() => {
                    searchAddress(startAddress, "start");
                    searchAddress(endAddress, "end");
                    fetchtest(sttPoint, dstPoint);
                  }}
                >
                  검색
                </button>
                </div>
              </div>
            )}

          {/* 지도 컨테이너 내에 버튼 추가 */}
          <button
            onClick={toggleNotificationDropdown}
            className="notification-settings-btn"
            style={{ position: "absolute", top: "0.4rem", left: "0.3rem", border:'none', backgroundColor:'transparent' }}
          >
            <img
            src={process.env.PUBLIC_URL + '/redbell.png'}
            alt='알림설정'
            style={{width:'3rem', height:'3rem'}}>
            </img>
          </button>

          <div
            className="switch_wrapper"
            style={{ position: "absolute", top: "0.4rem", right: "0.3rem" }} // 예시 위치
          >
            <input
              type="checkbox"
              id="switch"
              className="chkbox"
              onChange={onoffWMS}
              defaultChecked={false}
            />
            <label htmlFor="switch" className="switch_label">
              <span className="btn"></span>
            </label>
          </div>

          {isNotificationDropdownOpen && (
            <div
              className="notification-dropdown-menu"
              style={{ position: "absolute", top: "calc(0.4rem + 2.5rem + 0.4rem + 0.3rem)", left: "0.3rem" }}
            >
              {[...Array(11).keys()].map((i) => {
                const grade = i;
                return (
                  <label key={grade}>
                    <input
                      type="radio"
                      name="notificationGrade"
                      value={grade}
                      checked={selectedGrade === `${grade}`}
                      onChange={handleRadioChange}
                    />
                    {grade === 0 ? "OFF" : `${grade}급`}
                  </label>
                );
              })}
            </div>
          )}
            <CategoryList />
        </MapContext.Provider>
      </div>
    </main>
  </div>
);
};

export default Map