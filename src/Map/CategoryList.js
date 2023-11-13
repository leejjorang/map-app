import React from 'react';

// 긴급전화
function callEmergency() {
    window.location.href = "tel:112";
}

//경고음 - 알람mp3파일 넣어야함
function warnSound(){
    let sound = document.getElementById("alertSound");
    sound.play();
}

const CategoryList = () => {
        return <section id="category">
                <div className="category-container">
                    <div className="category-list">
                        <button className="category-item" id="culocation">현위치</button>
                        <button className="category-item" id="safeplace">안전장소</button>
                        <button className="category-item" id="urgenttext" onClick={callEmergency}>긴급전화</button>
                        <button className="category-item" id="warning" onClick={warnSound}>경고음</button>
                    </div>
                </div>
            </section>
        ;
}

/**                        <audio id="alertSound" src="alert.mp3" preload="auto"></audio>
 */

export default CategoryList;