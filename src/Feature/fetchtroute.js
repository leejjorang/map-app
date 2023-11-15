const start_x = 14371465.30;// 임의 설정
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
  })
  .catch(error => {
    console.error('Error:', error);
  });
