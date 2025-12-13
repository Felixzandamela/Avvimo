document.addEventListener("DOMContentLoaded", function () {
  const layout = document.getElementById("layout");
  let toggle = true;
  const navBtn = document.querySelector(".a_btn_Nav");
  navBtn.addEventListener("click", ()=>{
    if(toggle){layout.classList.add("aside_active");
    }else{layout.classList.remove("aside_active");}
    toggle = !toggle;
  });
  const asideLinks = document.querySelectorAll('.aside_link');
  asideLinks.forEach(link => {
    if (link.href === window.location.href) {
      link.classList.add('a_active');
    }
  });
  
  const shrunkenBtn = document.querySelector("#shrunkenBtn");
  const shrunken = localStorage.getItem('shrunken') === 'true';
  if (shrunken) {
    shrunkenBtn.checked = true;
    layout.classList.add("shrunken");
  } else {
    shrunkenBtn.checked = false;
    layout.classList.remove("shrunken");
  }
  shrunkenBtn.addEventListener("change", () => {
    if (shrunkenBtn.checked) {
      layout.classList.add("shrunken");
      localStorage.setItem('shrunken', 'true');
    } else {
      layout.classList.remove("shrunken");
      localStorage.setItem('shrunken', 'false');
    }
  });
  
  const themeBtn = document.querySelector(".themeBtn");
  const body= document.querySelector('body')
  const theme = localStorage.getItem("theme");
  
  if(theme === "dark"){
    body.classList.add("dark");
  }else{
    body.classList.remove("dark");
  }
  themeBtn.addEventListener("click",()=>{
    let theme = localStorage.getItem("theme");
    if(theme === "dark"){
      body.classList.remove("dark");
      localStorage.setItem('theme', '');
    }else{
      body.classList.add("dark");
      localStorage.setItem('theme', 'dark');
    }
  });
  
  let openProfile = true;
  const toggleProfileBtns =document.querySelectorAll(".a_toggle-profile");
  toggleProfileBtns.forEach(btn =>{
    btn.addEventListener("click",()=>{
      const secProfile = document.getElementById("a_sec_profile");
      secProfile.style.display = openProfile ? "inline" : "none";
      openProfile = !openProfile;
    });
  });
  let copyBtns = document.querySelectorAll('.copyBtn');
  let valuesToCopy = document.querySelectorAll('.valueToCopy');
  let iconCopys = document.querySelectorAll("#iconCopy");
  copyBtns.forEach((copyBtn, index)=>{
    copyBtn.addEventListener("click", ()=>{
      if(copyBtn.id="both"){
        if(!window.navigator.share){copyNow(index);}
        else{
          navigator.share({
            title:"Olá",
            text:"Parabens, recebeste 150.00 Mts de bonus boas vindas, para resgatar registra-se com o link abaixo.",
            url:valuesToCopy[index].textContent
          }).then(()=>{console.log("Successfully done");
          }).catch((error)=>{console.log(error);copyNow(index);});
        }
      }else{copyNow(index);}
    });
  });
  function copyNow(index){
    var range=document.createRange();
    range.selectNode(valuesToCopy[index]);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    const f = iconCopys[index].classList.value;
    iconCopys[index].classList = "bi bi-check-circle";
    setTimeout(()=>{
      iconCopys[index].classList = f;
    },2000);
  }
  
  
  try {
  if (document.querySelectorAll(".select")) {
    const selects = [...document.querySelectorAll(".select")];

    function toggleSelect(key, checked) {
      selects.forEach((item, index) => {
        if (index !== key) {
          item.classList.remove("active");
        }
      });
      selects[key].classList[checked ? "add" : "remove"]("active");
    }

    selects.forEach((item, key) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const checked = !item.classList.contains("active");
        toggleSelect(key, checked);
      });

      const accesskey = item.accessKey;
      const inputs = document.querySelectorAll(`.${accesskey}`);
      inputs.forEach((input) => {
        input.addEventListener("change", () => {
          document.getElementById(accesskey).textContent = input.accessKey;
          item.classList.remove("active");
        });
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".select")) {
        selects.forEach((item) => {
          item.classList.remove("active");
        });
      }
    });
  }
} catch (error) {};
  try{
    if(document.querySelectorAll(".updateProfile")){
      const updateProfiles = [...document.querySelectorAll(".updateProfile")];
      for(let h in updateProfiles){
        const c = updateProfiles[h].href;
        updateProfiles[h].href = `${c}?redirectTo=${updateProfiles[h].baseURI}`;
      }
    }
  }catch(error){};
  
const texts={
    Comcluido:{
    deposits: "Ao processar este depósito significa que você está prestes a adicionar o valor total do reembolso para este usuário.",
    withdrawals:"Ao processar esta retirada significa que você está prestes a enviar o dinheiro para uma conta eletrônica específica nesta retirada ou já enviou em off, e esta ação não será cancelada.",
    commissions:"Ao processar esta comissão significa que você está prestes a adicionar o valor da comissão para este usuário.",
  },
  Emprogresso:{
    deposits:"Tem certeza que deseja confirmar esse deposito?\nTenha certeza que este usuário enviou na plataforma o valor correspondente ou troque embaixo.",
    withdrawals:"",
    commissions:""
  },
  Anulado:{
    deposits:"Ao anular este depósito significa que o depósito não estará na lista de espera nem nos depósitos imaturos.",
    withdrawals:"Ao anular este saque significa que o dinheiro será devolvido à conta do usuário, esta ação não será cancelada.",
    commissions:"Ao anular esta comissão significa que o usuário não receberá esta comissão, esta ação não será cancelada.",
  },
  Rejeitado:"Tens certeza que deseja rejeitar esse",

}
try{
  if(document.querySelectorAll(".a_action_li")){
    const tcancel = [...document.querySelectorAll(".tcancel")];
    const a_actions = [...document.querySelectorAll(".a_action_li")];
    const a_action_t = document.querySelector("#a_action_t");
    const transaction_action = document.querySelector(".transaction_action");
    const submitBtn = document.querySelector("#submitBtn");
    const status = document.querySelector("#status");
    const type = document.querySelector("#type");
    
    a_actions.forEach((li,index)=>{
      li.addEventListener("click",()=>{
        a_action_t.style.display = "none";
        transaction_action.style.display = "inline";
        submitBtn.classList.add(li.accessKey);
        status.value = li.accessKey;
        document.getElementById("parag").textContent = li.accessKey == "Rejeitado" ? `${texts.Rejeitado} ${type.value}?` : texts[li.accessKey][type.value];
        document.getElementById("btnText").textContent = li.textContent;
      });
    
    tcancel.forEach((btn)=>{
      btn.addEventListener("click",()=>{
        a_action_t.style.display = "flex";
        transaction_action.style.display = "none";
        submitBtn.classList.remove(li.accessKey);
      });
    });
    })
  }
}catch(error){}

try{
    if(document.querySelectorAll(".card_stars")){
      const card_stars = document.querySelectorAll(".card_stars");
      card_stars.forEach((item)=>{
        const MAX_STARS = 5;
        const fullStars = Math.floor(parseInt(item.accessKey));
        const emptyStars = MAX_STARS - fullStars;
        const stars = `${[...Array(fullStars)].map((_, index) => ('<i class="bi bi-star-fill filled m5-r" ></i>')).join('')} ${[...Array(emptyStars)].map((_, index) => ('<i class="bi bi-star-fill m5-r"></i>')).join('')}`
        item.innerHTML = stars;
      });
    }
  }catch(error){};
  
  try{
    if(document.querySelectorAll(".input_check")){
      const input_checks = [...document.querySelectorAll(".input_check")];
      const tree = document.getElementById("main_wrap");
      const closeSelection = document.getElementById("closeSelection");
      const _ids = [...document.querySelectorAll(".ids")];
      let reviewsToUpdate = [];
      const updated = function(reviewsToUpdate){
        if(reviewsToUpdate.length > 0){
          tree.classList.add("active");
        }else{
          if(tree.classList.contains("active")){
            tree.classList.remove("active");
          }
        }
        const ids = reviewsToUpdate.join(">>>");
        for(let k in _ids){_ids[k].value = ids;}
        document.getElementById("reviewsToUpdate").textContent = `${reviewsToUpdate.length} selecionado${reviewsToUpdate.length > 1? "s":""}`;
      }
      input_checks.forEach((item) =>{
        item.addEventListener("change",()=>{
          if(item.checked){
            reviewsToUpdate.push(item.value);
          }else{
            const updatedReview = reviewsToUpdate.filter(id => id !== item.value);
            reviewsToUpdate = updatedReview;
          }
          updated(reviewsToUpdate);
        });
      });
      closeSelection.addEventListener("click", ()=>{
        for(let y in input_checks){
          input_checks[y].checked = false;
          const updatedReview = reviewsToUpdate.filter(id => id !== input_checks[y].value);
          reviewsToUpdate = updatedReview;
        }
        updated(reviewsToUpdate);
      });
    }
  }catch(error){};
 
 
});

try{
  if(document.querySelectorAll(".a_box_chart")){
    const charts = [...document.querySelectorAll(".a_box_chart")];
    charts.forEach((chart)=>{
      const datas = JSON.parse(chart.accessKey);
      const types = ["areaspline","column","area"];
      const g = types[Math.floor(Math.random()* types.length)]
      const options = {
        chart:{
          spacing:[0,0,0,0,0,0,0],
          type: g, //"area" ,"column","areaspline", "spline"
          style:{color:'currentColor',},
          backgroundColor: 'none', },
        title: {text:'' },
        credits:{enabled: false },
        accessibility:{ enabled:false},
        xAxis:{
          visible:false,
          categories: datas.months.sliced,
          crosshair: false,
          labels:{ style:{color:"currentColor" } }
        },
        yAxis: {
          visible:false,
          min: 0,
          className: "highcharts-color-0",
          gridLineColor:"transparent",
          labels:{ style:{color:"currentColor" } },
          title: { enabled:false, text: '',  }
        },
        tooltip: {
          headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
          pointFormat: '<tr><td style="color:{series.color};padding:0"></td>' + '<td style="padding:0 color:currentColor"><b>${point.y:.2f}</b></td></tr>', // for float number {point.y:.1f}
          footerFormat: '</table>',
          shared: true,
          useHTML: true
        },
        plotOptions: {
          areaspline:{
            lineWidth: 4,
            states: {hover: { lineWidth:2 }},
            marker: {enabled: false },
          }, 
          column: {
            lineWidth:2,
            pointPadding: 0,
            borderWidth: 0,
            borderRadius: 6
          },
        },
        series: [
          {
            name: "withdrawals",
            data: datas.datas,
            color:`rgb(${datas.color})`,//datas.color,
            fillColor : {
              linearGradient : [0, 0, 300, 300],
              stops : [[0,`rgb(${datas.color})`],[1,'transparent'], [2, 'transparent'], ]
            },
          }
        ],
        legend: {
          enabled: false,
          itemStyle: {color: 'currentColor', fontWeight: 'bold' },
        }
      }
      Highcharts.chart(chart, options);
    });
  }
}catch(error){};

try{
  if(document.querySelector(".chart")){
    const chart = document.querySelector(".chart");
      const datas = JSON.parse(chart.accessKey);
      const tool= document.getElementById("earns_tool");
      let nameArr = chart.title.split(" ");
      let name = nameArr[0] ? `, ${nameArr[0]}!` : "";
      tool.innerHTML =`<h4 class="title">${datas.status.title}</h4><p class="m5-t padd10-r subtitle">${datas.status.text}${name}</p>`
      const options = {
        chart:{
          spacing:[20,10,10,10],
          type: "areaspline", //"area" ,"column","areaspline", "spline"
          style:{color:'currentColor',},
          backgroundColor: 'none', },
        title: {text:'' },
        credits:{enabled: false },
        accessibility:{ enabled:false},
        xAxis:{
          visible:true,
          lineColor:`rgb(${datas.color})`,
          categories:datas.months.sliced,
          crosshair: false,
          labels:{ style:{color:"currentColor" }
          }
        },
        yAxis: {
          visible:true,
          min: 0,
          tickPixelInterval:50,
          className: "highcharts-color-0",
          gridLineColor:"transparent",
          labels:{ style:{color:"currentColor" } },
          title: { enabled:false, text: '',  }
        },
        tooltip: {
          headerFormat: '<span style="font-size:10px; margin-left:5px">{point.key}</span><table>',
          pointFormat: '<tr><td style="color:{series.color};padding:0"></td>' + '<td style="padding:0; color:{series.color};"><b>{point.y:.2f}</b></td></tr>', // for float number {point.y:.1f}
          footerFormat: '</table>',
          shared: true,
          useHTML: true
        },
        plotOptions: {
          areaspline:{
            lineWidth: 4,
            states: {hover: { lineWidth:2 }},
            marker: {enabled: false },
          }, 
          column: {
            lineWidth:2,
            pointPadding: 0,
            borderWidth: 0,
            borderRadius: 6
          },
        },
        series: [
          {
            name: "withdrawals",
            data: datas.datas,
            color:`rgb(${datas.color})`,
            fillColor : {
              linearGradient : [0, 0, 0, 300],
              stops : [[0,`rgb(${datas.color})`],[1,'transparent'], [2, 'transparent'], [3,'transparent']]
            },
          }
        ],
        legend: {
          enabled: false,
          itemStyle: {color: 'currentColor', fontWeight: 'bold' },
        }
      }
      Highcharts.chart(chart, options);
    console.log(Highcharts)
  }
}catch(error){};