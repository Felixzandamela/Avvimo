const express = require("express");
const bcrypt = require("bcryptjs");
function joinZero(number){return(number < 10 ? "0" + number : number).toString();}

const idGenerator = (length,type)=>{
  let string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", number = "0123456789", id="" , characters,size;
  switch(type){
    case "code": characters = number; size = 6; break;
    default: characters = string; size= length? length : 16; break;
  }
  for(var i=0; i < size; i++) {id += characters[Math.floor(Math.random()*characters.length)];}
  return id;
}
module.exports.idGenerator = function(type,length){return idGenerator(type,length);}

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
  },
  payouts:{
    title:["Pagamento","Pagamentos"],
    icon:  "bi bi-currency-dollar",
    color: "var(--main-color-rgba)"
  },
  emailsQueue:{
    title: ["Email", "Emails"],
    icon: "bi bi-envelope-arrow-up",
    color:"var(--main-color-rgba)"
  },
  promotions:{
    title: ["Promoção", "Promoçoes"],
    icon: "bi bi-gift",
    color: "var(--main-color-rgba)"
  }
} 
module.exports.coll = function(c){
  return !collections[c]? c : collections[c];
}
function concatURl(subdomin, query){
  const baseUrl = process.env.HOST;
  const protocol = process.env.PROTOCAL;
  let url = subdomin ? `${protocol}${subdomin}.${baseUrl}` : `${protocol}${baseUrl}`;
  let fullUrl = query? `${url}${query}` : url;
  return fullUrl;
}
module.exports.concatURl = function(subdomin,query){
  return concatURl(subdomin,query);
}
const getColor = () =>{
  const setHash = (b = [], length = 0,hash) => {while(length <= 2){hash = Math.floor(Math.random()*255);b.push(hash); length++;}return b;}, c = setHash();
  return {color:`rgb(${c})`,background: `rgba(${c},0.30)`}
} 
module.exports.getColor = getColor; 

// generate color * rgb(12, 56, 255)

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
    onlyMonthAndDate:mm+ " "+dd,
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
  const dataTime = d ? d : getTime().fullDate;
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


const objRevised  = function(target, source) {
  if (typeof target !== 'object' || typeof source !== 'object') {
    throw new Error('target e source devem ser objetos');
  }
  for (const key in source) {
    if (Object.hasOwn(source, key)) {
      if (typeof source[key] === 'object' && source[key] !== null) {
        if (!target[key] || typeof target[key] !== 'object') {target[key] = {};}
        objRevised(target[key], source[key]);
      } else {target[key] = source[key];}
    }
  }
  return target;
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
    console.error(error);
    return null;
  }
};

const containHtml = /<[a-z][\s\S]*>/i;
const defineValue = function(key,value,internal){
  if(!value && !internal){return}
  else if(typeof value === "string" && !!value.match(containHtml) && !internal){return
  }else if(/^(account|phoneNumber|dates)$/i.test(key)){return value;
  }else if(key === "ids"){return value.split(">>>");
  }else if(/^(date|expireAt)$/i.test(key)){
    if(internal){return Array.isArray(value) && value.length > 0 ? formatDate(value) : null;
    }else{return /^(expireAt)$/i.test(key)? expireDay(value) : getTime().fullDate;}
  }else if(typeof isBoolean(value) === "boolean"){return isBoolean(value);
  }else if(!isNaN(value) && value || typeof value === "number"){
    return internal? transformNumber(value) : parseFloat(value);
  }else{return value;}
}

const transformDatas = async function(obj, internal, sObj) {
  if (typeof obj !== 'object' || sObj && typeof sObj !== 'object') {
    console.error('obj e sObj devem ser objetos');
    return;
  }
  const shouldMerg = typeof sObj === "object";
  const mergedObj = shouldMerg?  objRevised(obj, sObj) : obj;
  const result = {};
  const ignoreKeys = /^(owner|fleet|gateway|_id|upline)$/i;
  for(const key in mergedObj){
    if(typeof mergedObj[key] === 'object' && !Array.isArray(mergedObj[key]) && !ignoreKeys.test(key)){
      result[key] = transformObject(mergedObj[key], internal);
    }else{
      if(key === 'newpassword') {
        const password = await crypt(mergedObj[key]);
        result['password'] = defineValue(key, password, internal);
      }else{
        let value = defineValue(key, mergedObj[key], internal);
        result[key] = typeof value === "string" && !internal? value.trim() : value;
        if(result[key] === "" && !internal || result[key] === undefined && !internal) delete result[key];
      }
    }
  }
  return result;
};

const transformObject = function(obj, internal) {
  const result = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      result[key] = transformObject(obj[key], internal);
    } else {
      result[key] = defineValue(key, obj[key], internal);
    }
  }
  return result;
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
      title: "Transações",
      link: `/${mode}/transactions`,
      icon: "bi bi-arrow-down-up"
    },{
      title: `Frotas`,
      link: `/${mode}/fleets`,
      icon: "bi bi-box"
    },
    {title: "Suporte",
      link: `/${mode}/support`,
      icon: "bi bi-headset"
    },
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
    },{
      title: "Emails",
      link: "/admin/e-mails",
      icon: "bi bi-envelope-at"
    },{
      title: "Promoçōes",
      link: "/admin/promotions",
      icon: "bi bi-gift"
    }
  ];
  const asideLinks = mode !== "admin" ? defaultAsideLinks : [...defaultAsideLinks,...adminAsideLinks];
  const keys = new Set();
  for (let a of asideLinks) {
    let link = a.link.split("/")[2];
    keys.add(link);
  }
  return{
    links: asideLinks,
    fields: JSON.stringify([...keys])
  } 
}

function compareEvent (schedule, today){
  const [eventMonth, eventDay] = schedule.split(" ");
  const [todayMonth, todayDay] = today.split(" ");
  const [start, end] = eventDay.split("-").map(Number);
  if(eventMonth !== todayMonth){return false}
  if(end){return Number(todayDay) >= start && Number(todayDay) <= end;}
  return Number(todayDay) === start;
}

module.exports.getScheduleEvent = function (promo){
  let currentEvent = null;
  if(!promo || !Array.isArray(promo)) {
    return null
  }
  for(let event of promo){
    if(compareEvent(event.dates, getTime().onlyMonthAndDate)){
      currentEvent = event;
    }
  }
  return currentEvent;
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
    title: current > previous ? "Bravo! 👏": "Mão na massa! 💪",
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
      }else if(/^(earnings|payouts)$/i.test(type)){
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
        currency: this.field = "users"? false : true,
        percentageDetails,
        last12Months
      }
    },
    this.getGarnings = async function(){
      const fieldIcon = collections[this.field];
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
      percentageDetails = new Percentage(totalThisWeek, totalThisMonth, total, fieldIcon, this.field);
      last12Months.status = compareMonthsDatas(last12Months.datas,this.field);
      last12Months.color = collections[this.field].color;
      const datasItems = [...datas[0].datas,...datas[1].datas];
      const totals = await transformDatas({total:total},true);
      return {
        datas:datasItems,
        color:collections[this.field].color,
        field:{default:this.field,external:collections[this.field].title[1]},
        total:totals.total,
        currency:true,
        percentageDetails,
        last12Months
      }
    }
  }
} // Classe para calcular o saldo e detalhes semanais, mensais e anuais

module.exports.cardDatas = async function(datas,field,language){
  return new CardBalance(datas,field,language);
}