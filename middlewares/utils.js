
const express = require("express");

const bcrypt = require("bcryptjs");
function joinZero(number){return(number < 10 ? "0" + number : number).toString();}

const texts ={
  timeUnits:["Agora","minuto","hora","dia","mês","ano"],
  ago:"atrás",
  rejectedPaymentWarn: "Rejeitado pelo sistema de pagamento.\nEntre em contato com seu banco e faça uma nova solicitação ou tente outro sistema de pagamento.",
  voidedPaymentWarn: "Por razões de irregularidades o valor foi revertido, talvez você não está classificado para receber este valor.",
  confirmedDepositWarn: "Seu depósito foi confirmado e o valor está em produção, após o vencimento, seu saldo estará disponível para retirada.",
  depositsInQueueWarn:"Aguardando pelo pagamento. Por favor siga as instruções para completar o seu depósito." ,
  withdrawalsInQueueWarn:"O seu saque está na fila. Isso pode levar 48 horas ou 7 dias úteis. Pedimos que você tenha muita paciência.",
  commissionsInQueueWarn:"Sua comissão está na fila, sua confirmação depende muito mais da confirmação do depósito do seu downline.",
}

const collections = {
  users:{
    title: ["Usuarío", "Usuaríos"],
    icon: "bi bi-people",
    color:"var(--main-color-rgba)"
  },
  fleets:{
    title: ["Frota","Frotas"],
    icon:  "bi bi-box",
    color:"var(--main-color-rgba)"
  },
  gateways:{
    title:["Metódo de pagamento","Metódos de pagamento"],
    icon:  "bi bi-credit-card",
    color:"var(--main-color-rgba)"
  },
  deposits:{
    title: ["Deposíto","Deposítos"],
    icon:  "bi bi-currency-dollar",
    color: "5, 226, 126"
  },
  commissions:{
    title:["Comição", "Comicões"],
    icon:  "bi bi-link-45deg",
    color: "var(--main-color-rgba)"
  },
  withdrawals: {
    title:["Saque", "Saques"],
    icon:  "bi bi-currency-dollar",
    color: "255,17,0"
  },
  reviews:{ 
    title:["Crítica","Críticas"],
    icon:  "bi bi-chat-square-quote",
    color: "5, 226, 126"
  },
  earnings:{
    title:["Ganho","Ganhos"],
    icon:  "bi bi-currency-dollar",
    color: "var(--main-color-rgba)"
  }
} 
module.exports.coll = function(c){
  return !collections[c]? c : collections[c];
}

function _defineProperty (obj,target={}){
  for(key in obj){
    Object.defineProperty(target,key,{
      value: obj[key],
      enumerable: true,
      configurable: true,
      writable: true
    });
  }
  return target;
}
module.exports._defineProperty = function(obj,target){
  return _defineProperty(obj,target);
}

function numberSeparotor (number, float){
  let num = float ? parseFloat(number || 0).toFixed(2) : number || 0;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function numberUnits (number,float){
  let f =  float ? float : false;
  const unitsNames = ['',' Mil',' M',' B',' T',' Q',' Q',' S',' S',' O',' N',' D']; 
  const units = Math.floor(Math.log10(Math.abs(number)) / 3);
  const order = Math.max(0, Math.min(units, unitsNames.length -1 ));
  const suffix = unitsNames[order]; 
  return number < 1000000 ? numberSeparotor(number,f) : parseFloat(number / Math.pow(10, order * 3)).toFixed(2) + suffix;
}

const transformNumber = function(number,float){
  let f =  float ? float : false;
  return{
    default: number,
    numberUnits: numberUnits(number,f),
    numberSeparotor: {
      a: numberSeparotor(number),
      b: numberSeparotor(number,true)
    }
  }
}
const getTime = function(){
  const today = new Date();
  let now = [today.getHours(),today.getMinutes(),today.getSeconds()]; 
  let dd = joinZero(today.getDate()), mm = today.getMonth(), yyyy = today.getFullYear();  
  let currentTime = (t=[])=>{for(let i in now){t.push(joinZero(now[i]))} return t.join(":");}
  return{
    fullDate:[mm, dd, yyyy, currentTime()],
    onlyTime:currentTime(),
    onlyDate:[mm, dd, yyyy],
    onlyMonthAndYear: mm + " "+ yyyy,
    onlyYear: yyyy
  }
}
module.exports.getTime = function(){return getTime();}

const runningDays = function (date){
  const time = (new Date()).getTime() - date.getTime(); 
  return{
    days: Math.floor(time/ 1000/60/60/24),
    minutes:Math.floor(time/1000/60),
    seconds:Math.floor(time/ 1000)} 
}// contar dias passados específicando o dia 

const timeAgo=(date) => {
  let ms = (new Date()).getTime() - date.getTime(), seconds=Math.floor(ms/1000), minutes=Math.floor(seconds/60), hours=Math.floor(minutes/60), days=Math.floor(hours/24), months=Math.floor(days/30), years=Math.floor(months/12); 
  let runningTime=ms === 0 || seconds < 60 ? {time: seconds, unit:0} : minutes < 60 ? {time: minutes, unit:1} : hours < 24 ? {time : hours, unit:2} : days < 30 ? {time : days, unit:3} : months < 12 ? {time:months, unit:4} : {time: years, unit:5};
  let currentTimeUnits=runningTime.time > 1 && runningTime.unit === 4 ? "meses" : runningTime.time > 1 ? texts.timeUnits[runningTime.unit]+"s": texts.timeUnits[runningTime.unit];
  return runningTime.unit < 1 ? texts.timeUnits[0] : [runningTime.time, currentTimeUnits, texts.ago].join(" ");
}

const formatDate=(d) =>{
  const locales =["pt-PT","en-US"];
  const dataTime = d ? d : getTime();
  const date=new Date(0,dataTime[0]), monthName=date.toLocaleString(locales[0],{month:'long'});
  const capitalizeMonth=monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const dateToTimer=`${date.toLocaleString(locales[1],{month:'long'})}, ${[dataTime[1], dataTime[2], dataTime[3]].join(' ')}`;
  let runnintime=runningDays(new Date(dateToTimer));
  return{
    fullDate:`${capitalizeMonth}, ${[dataTime[1], dataTime[2],dataTime[3]].join(' ')}`,
    onlyDate:`${capitalizeMonth}, ${[dataTime[1], dataTime[2]].join(' ')}`,
    onlyMonthAndYear:`${[capitalizeMonth, dataTime[2]].join(' ')}`,
    timeAgo:timeAgo(new Date(dateToTimer)),
    daysLength: runnintime.days,
    minutesLength: runnintime.minutes,
    secondsLength: runnintime.seconds
  }
}// formating date to view 
module.exports.formatDate = function(date){return formatDate(date);};

const expireDay = function(duration){
  var date = new Date();   
  Date.prototype.addDays=function(days){   
    let day = new Date(this.valueOf()); day.setDate(date.getDate()+ days);
    return [joinZero(day.getMonth()), joinZero(day.getDate()), day.getFullYear(), getTime().onlyTime]
  }
  return duration ? date.addDays(duration) : null;
}
module.exports.expireDay=(duration)=> {return expireDay(duration);}
// get future date by assigning a value of dates

const propertysLength = function(datas){
  const keys = typeof datas == "object" ? Object.getOwnPropertyNames(datas) : [];
  return keys.length;
}
module.exports.propertysLength = function(datas){return propertysLength(datas)};


const objRevised = function(datas, nester){
  const keys = Object.getOwnPropertyNames(nester);
  for(let k in keys){
    if(!datas[keys[k]]){
      datas[keys[k]] = nester[keys[k]];
    }else{datas[keys[k]] = nester[keys[k]];}
  }
  return datas;
};
module.exports.objRevised = function(datas,nester){return objRevised(datas,nester);};

const isBoolean = function(data){
  const boolean = {"false":false,"true":true,"null": null,"undefined" :undefined}
  return boolean[data];
};

const crypt = async function(item){
  try{
    const salt = await bcrypt.genSalt(15);
    const hash = await bcrypt.hash(item, salt);
    return hash;
  }catch(error){
    console.log(error);
    return null;
  }
};

const transformDatas = async function(item,internal,nester){
  let datas = typeof nester == "object" ? objRevised(item,nester) : item;
  if(datas){
  const keys = Object.getOwnPropertyNames(datas);
  const newDatas = {};
  for(let x in keys){
    const name = keys[x];
    if(!datas[name] && !internal){
    }else if(name == "newpassword"){
      newDatas["password"] = await crypt(datas[name]);
    }else if(/^(account|phoneNumber)$/i.test(name)){
      newDatas[name] = datas[name];
    }else if(name == "ids"){
      newDatas[name] = datas[name].split(">>>");
    }else if(/^(date|expireAt|cronTodelete)$/i.test(name)){
      if(internal){
        newDatas[name] = Array.isArray(datas[name]) && datas[name].length > 0 ? formatDate(datas[name]) : null;
      }else{
        newDatas[name] = /^(expireAt|cronTodelete)$/i.test(name)? expireDay(datas[name]) : getTime().fullDate;
      }
    }else if(typeof isBoolean(datas[name]) == "boolean"){
      newDatas[name] = isBoolean(datas[name]);
    }else if(!isNaN(datas[name]) && datas[name] || typeof datas[name] == "number"){
      newDatas[name] = internal? transformNumber(datas[name]) : parseFloat(datas[name]);
    }else{
      newDatas[name] = datas[name];
    }
  }
  return newDatas;
  }else{
    return;
  }
};
module.exports.transformDatas = async function(item,internal,nester){return await transformDatas(item,internal,nester);}

function filterByDate(item){
  const d = {
    month: formatDate(getTime().fullDate).onlyMonthAndYear,
    today: formatDate(getTime().fullDate).onlyDate
  }
  return !d[item]? undefined : d[item];
}
module.exports.filterByDate = function(item){return filterByDate(item);}

const sortByDays = (a,b) =>{
  if (a.date.secondsLength < b.date.secondsLength)
     return -1;
  if (a.date.secondsLength  > b.date.secondsLength)
    return 1;
  return 0;
}// sort datas by days length;
module.exports.sortByDays = function(a,b){return sortByDays(a,b);};


module.exports.statusIcons = {
  Pendente:"bi bi-circle",
  EmProgresso:"bi bi-clock",
  Concluido:"bi bi-check-circle",
  Rejeitado:"bi bi-slash-circle",
  Anulado:"bi bi-arrow-left-circle"
}
module.exports.msgsStatus = function(status, type){
  const shows = {
    Concluido:null,
    Pendente:texts[`${type}InQueueWarn`],
    EmProgresso:type !== "deposits" ? null : texts.confirmedDepositWarn,
    Rejeitado: texts.rejectedPaymentWarn,
    Anulado:texts.voidedPaymentWarn
  }
  return shows[status];
}

module.exports.flashs = function(e,t,c){
  const type= {
    set:{error:"Salvar",success:"Salvado"},
    update:{error:"Atualizar",success:"Atualizado"},
    updateMany:{error:"Atualização em massa", success:"Atualizados"},
    delete:{error:"Deletar",success:"Deletado"},
    get:{error:"Buscar",success:"Encontrado"}
  }
  const msg= {
    success:`${collections[c].title[0]} ${type[t]["success"].toLowerCase()} com sucesso!`,
    error:`Houve um erro ao ${type[t]["error"].toLowerCase()} ${collections[c].title[0].toLowerCase()}!`,
    exist:`Este ${collections[c].title[0].toLowerCase()} já existe!`,
    empty:`Nenhum ${collections[c].title[0].toLowerCase()} foi encontrado!`
  }
  return !e? "Houve um erro inesperado" : msg[e];
}

module.exports.asideLinks = function(mode){
  const defaultAsideLinks = [
    {
      title: "Painel",
      link: `/${mode}/dashboard` ,
      icon: "bi bi-grid"
    },{
      title: "Suporte",
      link: `/support`,
      icon: "bi bi-headset"
    },{
      title: "Depósitos",
      link: `/${mode}/transactions/deposits`,
      icon: "bi bi-box-arrow-in-up"
    },{
      title: "Saques",
      link: `/${mode}/transactions/withdrawals`,
      icon: "bi bi-box-arrow-down"
    },{
      title: "Comicões",
      link: `/${mode}/transactions/commissions`,
      icon: "bi bi-link-45deg"
    },{
      title: `Frotas`,
      link: `/${mode}/fleets`,
      icon: "bi bi-box"
    }
  ];
  const adminAsideLinks = [
    {
      title: "Metedos de pagamentos",
      link: "/admin/gateways",
      icon: "bi bi-credit-card"
    },{
      title: "Usuaríos",
      link: "/admin/users",
      icon: "bi bi-people"
    },{
      title: "Criticas",
      link: "/admin/reviews",
      icon: "bi bi-chat-square-quote"
    }
  ];
  const asideLinks = mode !== "admin" ? defaultAsideLinks : [...defaultAsideLinks,...adminAsideLinks];
  return asideLinks;
}

const ThisWeek = function(language) {
  language = language ? language : "pt-PT";
  const current = new Date()
  var week = [], dates = []; 
  current.setDate((current.getDate() - current.getDay()));
  for(var i = 0; i < 7; i++){
    week.push(new Date(current)); 
    current.setDate(current.getDate() +1);
  }
  for(let i in week){
    const month = week[i].toLocaleString(language,{month:'long'});
    const capitalizeMonth = month.charAt(0).toUpperCase() + month.slice(1);
    let dd = capitalizeMonth+", "+joinZero(week[i].getDate())+" "+week[i].getFullYear()
    dates.push(dd)
  }
  return dates
}//Função pra obter dias da semana atual

const getLast12Months = (language)=>{
  language = language ? language : "pt-PT";
  var date = new Date();
  var mms = date.getMonth()+1;
  var yyyy = date.getFullYear();
  function previousMonths(language) {
    if (mms > 0) {mms--;} else {mms = 11;yyyy--;}
    const month = new Date(yyyy,mms).toLocaleString(language,{ month: 'long' });
    const capitalizeMonth = month.charAt(0).toUpperCase() + month.slice(1);
    return { mm: capitalizeMonth, year: yyyy };
  }
  let y = 0,  arrOfFull = [] ,arrOfSliced=[];
  while(y < 12){
    let lastMonths = previousMonths(language);
    var MonthAndYear = [lastMonths.mm,lastMonths.year].join(" ");
    arrOfSliced.push(MonthAndYear.slice(0,3));
    arrOfFull.push(MonthAndYear);
    y++
  }
  return {
    full:arrOfFull.reverse(), sliced:arrOfSliced.reverse()
  }
} // Função para obter os últimos 12 meses

const compareMonthsDatas = function(datas,type){
  const [previous] = datas.slice(-2);
  const [current] = datas.slice(-1);
  return{
    title: current > previous ? "Bravo! 👏": "Vamos trabalhar! 💪",
    text: current > previous ? `Parabéns, mais ${collections[type].title[1]} que mês passado` : "Este mês ainda estamos baixo que mês passado"
  }
}

const getYearlyChartdatas = (datas,language, type)=>{
  language = language ? language : "pt-PT";
  const arr = new Array();
  const months = getLast12Months(language);
  for(var i = 0; i < months.full.length; i++){
    var MonthAndYear = months.full[i];
    let totalInThisMonth = 0;
    for(let d in datas){
      var day = datas[d].date.onlyMonthAndYear;
      if(type === "users"){
        if(day === MonthAndYear){
          totalInThisMonth++
        }
      }else if(type === "earnings"){
        if(/^(Concluido)$/i.test(datas[d].status) && day === MonthAndYear){
          totalInThisMonth +=  datas[d].income.default;
        }
      }else{
        if(/^(EmProgresso|Concluido)$/i.test(datas[d].status) && day === MonthAndYear){
          totalInThisMonth += datas[d].amount.default;
        }
      }
    }
    arr.push(totalInThisMonth);
  }
  return {
    datas: arr,
    months
    }
} // Função para obter os dados anuais


class Percentage {
  constructor(totalThisWeek,totalThisMonth,total,fieldIcon,field){
    this.period = totalThisWeek !== 0;
    this.total =  this.period ?  transformNumber(totalThisWeek) : transformNumber(totalThisMonth),
    this.p = isNaN(parseFloat((this.total.default *100) / total))? 0 : parseFloat((this.total.default *100) / total);
    this.arrow = this.p > 0 ? "up":"down";
    this.percentage = parseFloat(this.p).toFixed(2);
    this.field = field;
    this.fieldIcon = fieldIcon;
  }
}

class CardBalance{
  constructor(datas,field,language){
    this.field = field;
    this.datas = datas;
    this.getTotals = async function(){
      let total = 0, totalThisWeek = 0, totalThisMonth = 0, percentageDetails, last12Months, isUsers = field === "users";
      const fieldsIcon ={
        deposits: "bi bi-currency-dollar",
        withdrawals:"bi bi-currency-dollar",
        commissions:"bi bi-link-45deg",
        users: "bi bi-people"
      }
      language = language ? language : "pt-PT";
      let weekDays = ThisWeek(language);
      for(let i in datas){
        datas[i] = await transformDatas(datas[i]._doc, true);
        if(isUsers){
          total++;
          for(let h in weekDays){
            if(datas[i].date.onlyDate === weekDays[h]){totalThisWeek++;}
          }
          if(formatDate(getTime().fullDate).onlyMonthAndYear === datas[i].date.onlyMonthAndYear){totalThisMonth++;}
        }else{
          if(/^(EmProgresso|Concluido)$/i.test(datas[i].status)){
            total+= datas[i].amount.default;
            for(let h in weekDays){
              if(datas[i].date.onlyDate === weekDays[h]){
                totalThisWeek += datas[i].amount.default;
              }
            }
            if(formatDate(getTime().fullDate).onlyMonthAndYear === datas[i].date.onlyMonthAndYear){
              totalThisMonth+= datas[i].amount.default;
            }
          }
        }
      }
      const icon = collections[this.field].icon;
      percentageDetails = new Percentage(totalThisWeek, totalThisMonth, total, icon, field);
      last12Months = getYearlyChartdatas(datas,language, isUsers? field : null);
      last12Months.status = compareMonthsDatas(last12Months.datas,field);
      last12Months.color = collections[this.field].color;
      const totals = await transformDatas({total:total},true);
      return{
        datas: this.datas.sort(sortByDays),
        color: collections[this.field].color,
        field: { default:this.field, external:collections[this.field].title[1]},
        total: totals.total,
        percentageDetails,
        last12Months
      }
    },
    this.getGarnings = async function(){
      const fieldsIcon ={earnings: "bi bi-currency-dollar"};
      let total = 0, totalThisWeek = 0, totalThisMonth = 0, percentageDetails, lastMonths = datas[1].last12Months;
      let weekDays = ThisWeek(language);
      let last12Months = {
        datas:[],
        months:lastMonths.months
      }
      for(let j in lastMonths.datas){last12Months.datas[j] = lastMonths.datas[j];}
      
      for(let i in datas){
        if(datas[i].field.default === "deposits"){
          const currentArray = datas[i].datas;
          for(let h in currentArray){
            if(/^(Concluido)$/i.test(currentArray[h].status)){
              total += currentArray[h].income.default;
              for(let w in weekDays){
                if(currentArray[h].date.onlyDate === weekDays[w]){totalThisWeek+= currentArray[h].income.default;}
              }
              if(formatDate(getTime().fullDate).onlyMonthAndYear === currentArray[h].date.onlyMonthAndYear){
                totalThisMonth+= currentArray[h].income.default;
              }
              for(let m in lastMonths.months.full){
                const month = lastMonths.months.full[m];
                if(month === currentArray[h].date.onlyMonthAndYear){
                  last12Months.datas[m] += currentArray[h].income.default;
                }
              }
            }
          }
        }else{
          total += datas[i].total.default;
          if(datas[i].percentageDetails.period){
            totalThisWeek += datas[i].percentageDetails.total.default;
          }else{
            totalThisMonth += datas[i].percentageDetails.total.default;
          }
        }
      }
      const icon = fieldsIcon["earnings"];
      percentageDetails = new Percentage(totalThisWeek, totalThisMonth, total, icon, "earnings");
      last12Months.status = compareMonthsDatas(last12Months.datas,"earnings");
      last12Months.color = collections["earnings"].color;
      const datasItems = [...datas[0].datas,...datas[1].datas];
      const totals = await transformDatas({total:total},true);
      return {
        datas:datasItems,
        color:collections["earnings"].color,
        field:{default:"earnings",external:collections["earnings"].title[1]},
        total:totals.total,
        percentageDetails,
        last12Months
      }
    }
  }
} // Classe para calcular o saldo e detalhes semanais, mensais e anuais

module.exports.cardDatas = async function(datas,field,language){
  return new CardBalance(datas,field,language);
}