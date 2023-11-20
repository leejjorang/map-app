import React, {useState, useContext, useEffect} from 'react';
import Modal from "./Modal"; // 모달 컴포넌트 임포트
import { Tile as TileLayer, Vector, Marker } from 'ol/layer'
import { XYZ, TileWMS, Vector as VectorWMS } from 'ol/source'
import MapContext from '../Map/MapContext';

const safeKey = process.env.REACT_APP_SAFE_KEY;
const mapKey = process.env.REACT_APP_MAP_KEY;

// 다른 필요한 함수들
function callEmergency() {
  window.location.href = "tel:112";
}

function warnSound() {
  let sound = document.getElementById("alertSound");
  sound.play();
}


// CategoryList 컴포넌트
const CategoryList = () => {
  const {map} = useContext(MapContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const safePlaces = ["편의점", "소방안전시설", "치안시설"];
  const modalHeight = 80; // 모달의 대략적인 높이
  const initialCheckedStates = {
    [safePlaces[0]]:false,
    [safePlaces[1]]:false,
    [safePlaces[2]]:false,
  }
  const [checkedStates, setCheckedStates] = useState(initialCheckedStates); // 체크 상태를 저장할 상태 추가
  const [isPlaying, setIsPlaying] = useState(false); // 경고음 재생 상태
  const [audio] = useState(new Audio(process.env.PUBLIC_URL+"/siren.mp3")); // 오디오 객체 생성

  const [cnvLayer, setCnvLayer] = useState(null);
  const [fireLayer, setFireLayer] = useState(null);
  const [safeLayer, setSafeLayer] = useState(null);

  // 경고음 재생/중지 토글 함수
  const toggleSound = () => {
    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0; // 소리를 처음부터 다시 시작하게 하려면 이 줄을 추가하세요.
    } else {
      audio.play().catch((e) => console.error("Playback failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const cnvSource = new TileWMS({
      url: 'https://www.safemap.go.kr/openApiService/wms/getLayerData.do',
      params: {     
        'apikey':`${safeKey}`,
        'layers':'A2SM_CMMNPOI', 
        'styles':'A2SM_CMMNPOI_08'},
      transition: 0,
      projection: 'EPSG:4326',
    })
  
  const fireSource = new TileWMS({
      url: 'https://www.safemap.go.kr/openApiService/wms/getLayerData.do',
      params: {     
          'apikey':`${safeKey}`,
          'layers':'A2SM_CMMNPOI3', 
          'styles':'A2SM_CmmnPoi3'},
      transition: 0,
      projection: 'EPSG:4326',
      })

  const safeSource = new TileWMS({
      url: 'https://www.safemap.go.kr/openApiService/wms/getLayerData.do',
      params: {     
          'apikey':`${safeKey}`,
          'layers':'A2SM_CMMNPOI2', 
          'styles':'A2SM_CmmnPoi2'},
      transition: 0,
      projection: 'EPSG:4326',
      })

      setCnvLayer(new TileLayer({source: cnvSource}));
      setFireLayer(new TileLayer({source: fireSource}));
      setSafeLayer(new TileLayer({source: safeSource}));

      return() => {
        if (cnvLayer) map.removeLayer(cnvLayer);
        if (fireLayer) map.removeLayer(fireLayer);
        if (safeLayer) map.removeLayer(safeLayer);

        setCheckedStates(initialCheckedStates);
      };
  }, [map]);
  

  const handleChecked = (name) => {
    if(name.name === `${safePlaces[0]}`){
        map.addLayer(cnvLayer);
    }else if(name.name === `${safePlaces[1]}`){
        map.addLayer(fireLayer);
    }else if(name.name === `${safePlaces[2]}`){
        map.addLayer(safeLayer);
    }
  }

  const handleUnChecked = (name) => {
    if(name.name === `${safePlaces[0]}`){
      map.removeLayer(cnvLayer);
    }else if(name.name === `${safePlaces[1]}`){
        map.removeLayer(fireLayer);
    }else if(name.name === `${safePlaces[2]}`){
        map.removeLayer(safeLayer);
    } 
  }

  // 체크 상태 변경을 처리하는 함수
const handleCheckChange = (event) => {
    const { name, checked } = event.target;
    setCheckedStates((prevStates) => ({
      ...prevStates,
      [name]: checked,
    }));
    if(checked){
        handleChecked({name});
    }else{
        handleUnChecked({name});
    }
  };

  const openModal = (event) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const modalWidth = 80; // 모달의 대략적인 너비, 실제 너비에 맞게 조정 필요

    setModalPosition({
      top: buttonRect.top - modalHeight, // 모달의 높이를 고려하여 버튼 위에 위치시킵니다.
      left: buttonRect.left + buttonRect.width / 2 - modalWidth / 2, // 버튼의 중앙에 모달을 정렬합니다.
    });
    setIsModalOpen(true);
  };

  return (
    <section id="category">
      <div className="category-container">
        <div className="category-list">
          <button className="category-item" id="culocation">
            현위치
          </button>
          <button className="category-item" id="safeplace" onClick={openModal}>
            안전장소
          </button>
          <Modal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            position={modalPosition}
          >
            <ul>
              {safePlaces.map((place) => (
                <li key={place}>
                  <input
                    type="checkbox"
                    id={`checkbox-${place}`}
                    name={place}
                    checked={checkedStates[place] || false}
                    onChange={handleCheckChange}
                  />
                  <label htmlFor={`checkbox-${place}`}>{place}</label>
                </li>
              ))}
            </ul>
          </Modal>
          <button
            className="category-item"
            id="urgenttext"
            onClick={callEmergency}
          >
            긴급전화
          </button>
          <button className="category-item" id="warning" onClick={toggleSound}>
            {isPlaying ? "경고음 중지" : "경고음 재생"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategoryList;