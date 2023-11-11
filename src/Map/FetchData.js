const parseString = require('react-native-xml2js').parseString;
const safeKey = process.env.REACT_APP_SAFE_KEY;

export function fetchData(){
  
    // 안에 들어가는 인증키는 .env 파일로 따로 분리 권장
    const info = `https://safemap.go.kr/openApiService/data/getSecurityFacilityData.do?serviceKey=${safeKey}&pageNo=1&numOfRows=3378`;
  
    fetch(info)
    .then(res => res.text())
    .then((response) => {
      const cleanedData = response.replace('\ufeff', '');
      parseString(cleanedData, (err, result) => {
        if(err != null){
          console.log('error : ', err);
          return;
        }
        
        const item = result.response.body[0].items[0].item;       // 데이터 내용
  
        for(let i=0; i<item.length; i++){
          console.log(item[i].OBJT_ID, item[i].X, item[i].Y);     // console 확인용, 원하는 내용 변경 후 추출 가능
        }
      })
    })
    .catch((error) => {
      console.log("error: ",error);
    });
};
  