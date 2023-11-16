function openMenu() {
    document.getElementById("main").style.marginLeft = "250px";
    document.querySelector('.sidebar').style.width = "250px";
    document.querySelector('.openbtn').style.display = 'none';
}

function closeMenu() { 
    document.getElementById("main").style.marginLeft= "0";
    document.querySelector('.sidebar').style.width = "0";
    document.querySelector('.openbtn').style.display = 'block';
}

const Menu = () => {
    return(<>
        <div className="sidebar">
            <a className="closebtn" onClick={closeMenu}>×</a>
            <a href="#">회사소개</a>
            <a href="#">연혁</a>
            <a href="#">비즈니스</a>
            <a href="#">연락처</a>
        </div>
        <button className="openbtn" onClick={openMenu}>
            ☰ 메뉴 열기
        </button>
    </>  
    );
}

export default Menu;