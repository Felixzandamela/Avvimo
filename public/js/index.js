document.addEventListener("DOMContentLoaded" || "DOMContentReLoaded",  function () {
  const closeAlertBtn = document.querySelector(".close-alert-btn");
  try{
    if(closeAlertBtn){
      closeAlertBtn.addEventListener("click", function () {
    const alertCard = document.getElementById("alert_card");
    alertCard.style.display = "none";
  });
    }
  }catch(error){};
  
  
  function handleClassList(el,ev,cl){
    const elem = document.querySelector(el);
    const even = document.querySelector(ev);
    even.addEventListener("click", ()=>{
      if(!elem.classList.contains(cl)){
        elem.classList.add(cl);
      }else{elem.classList.remove(cl);}
    });
  }
  try{
    if(document.querySelector(".nav_btn")){
      handleClassList("body",".nav_btn","nav_active");
    }
  }catch(error){};
  if(document.querySelector("#year")){
    console.log(document)
    document.querySelector("#year").textContent = `${new Date().getFullYear()}`
  }
  
});
try{
  if(document.querySelector(".min_loader")){
    const loader = document.querySelector(".min_loader");
    if(loader){
      loader.style.display = "none";
      document.getElementById(".btnText").style.display = "inline";
    }
  }
}catch(error){};
try{
  if(document.querySelector("#back")){
    const back = document.querySelector("#back");
    if(back){
      back.addEventListener("click", () =>{
        window.history.back();
        return false;
      });
    }
  }
}catch(error){};

const toggles = function(btn,close,popup){
  const btns = [...document.querySelectorAll(`.${btn}`)];
  const popups = [...document.querySelectorAll(`.${popup}`)];
  const closes = [...document.querySelectorAll(`.${close}`)];
  btns.forEach((item,key)=>{
    item.addEventListener("click",()=>{
      popups[key].style.display = "flex";
    });
  });
  closes.forEach((item,key)=>{
    item.addEventListener("click",()=>{
      popups[key].style.display = "none";
    });
  });
}
try{
  if(document.querySelectorAll('.reviewViewBtn')){
    toggles("reviewViewBtn","a_close_reviews","reviewPopup");
  }
  if(document.querySelectorAll(".alertEvent")){
    toggles("alertEvent","canselAlert","alertBox");
  }
}catch(error){};

const scrollToTop = document.getElementById("scrollToTop");
const handleScroll = () => {
  if(document.getElementById("m-nav")){
    const  nav = document.getElementById("m-nav");
    if(window.pageYOffset > 20){
      nav.style.boxShadow = "0px 4px 8px rgba(0,0,0,0.10)";
    }else{nav.style.boxShadow = "none";}
  }
  if(window.pageYOffset > window.outerHeight) {
    scrollToTop.style.display = 'flex';
  } else {scrollToTop.style.display = 'none';}
};
window.addEventListener('scroll', handleScroll);

scrollToTop.addEventListener("click",function(){window.scrollTo(0,0);});