document.addEventListener("DOMContentLoaded", function (){
const runningDays = function (date){
  const time = (new Date()).getTime() - date.getTime(); 
  return{
    days: Math.floor(time/ 1000/60/60/24),
    minutes:Math.floor(time/1000/60),
    seconds:Math.floor(time/ 1000)} 
}// contar dias passados específicando o dia 

const timeAgo=(date) => {
  const timeUnits = ["Agora","minuto","hora","dia","mês","ano"];
  let ms = (new Date()).getTime() - date.getTime(), seconds=Math.floor(ms/1000), minutes=Math.floor(seconds/60), hours=Math.floor(minutes/60), days=Math.floor(hours/24), months=Math.floor(days/30), years=Math.floor(months/12); 
  let runningTime=ms === 0 || seconds < 60 ? {time: seconds, unit:0} : minutes < 60 ? {time: minutes, unit:1} : hours < 24 ? {time : hours, unit:2} : days < 30 ? {time : days, unit:3} : months < 12 ? {time:months, unit:4} : {time: years, unit:5};
  let currentTimeUnits=runningTime.time > 1 && runningTime.unit === 4 ? "meses" : runningTime.time > 1 ? timeUnits[runningTime.unit]+"s": timeUnits[runningTime.unit];
  return runningTime.unit < 1 ? timeUnits[0] : [runningTime.time, currentTimeUnits, "atrás"].join(" ");
}
  
  
  function joinZero(number){return(number < 10 ? "0" + number : number).toString();}
const getCurrentTime = ()=>{
  const today = new Date();
  let now = [today.getHours(),today.getMinutes(),today.getSeconds()]; 
  let dd = joinZero(today.getDate()), mm = today.getMonth(), yyyy = today.getFullYear();  
  let currentTime = (t=[])=>{for(let i in now){t.push(joinZero(now[i]))} return t.join(":");}
  return{
    fullDate:[mm, dd, yyyy, currentTime()],
    onlyTime:currentTime(),
    onlyDate:[mm, dd, yyyy],
    onlyMonthAndYear: mm + " "+ yyyy
  }
}// get r time and date


const formatDate=(d) =>{
  const locales =["pt-PT","en-US"];
  const dataTime = d? d: getCurrentTime().fullDate;
  const date=new Date(0,dataTime[0]), monthName=date.toLocaleString("pt-PT",{month:'long'});
  const capitalizeMonth=monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const dateToTimer=`${date.toLocaleString("en-US",{month:'long'})}, ${[dataTime[1], dataTime[2], dataTime[3]].join(' ')}`;
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


const expireDay=(duration)=> {
  var date=new Date();   
  Date.prototype.addDays=function(days){   
    let day = new Date(this.valueOf()); day.setDate(date.getDate()+ days);
    return [day.getMonth(), joinZero(day.getDate()), day.getFullYear(), getCurrentTime().onlyTime]
  }
  return date.addDays(duration)
}// get future date by assigning a value of dates

  const amounts = document.querySelector("#amounts");
  const accounts = document.querySelector("#accounts");
  const btnGateway = document.querySelectorAll(".btnGateway");
  const percentage = document.querySelector("#percentage");
  const maturity = document.querySelector("#maturity");
 
  class NewDeposit{
    constructor(amount, percentage, maturity,account){
      this.amount = !amount ? 0 : parseFloat(amount);
      this.income = (amount * (parseFloat(percentage) /100));
      this.totalIncome = this.amount + this.income;
      this.account = account;
      this.date =  formatDate().fullDate;
      this.expireAt =formatDate(expireDay(parseInt(maturity))).fullDate;
    }
  }
  const g = ()=>{
    const calcule = new NewDeposit(amounts.value,percentage.value,maturity.value, accounts.value);
    document.getElementById("val").textContent = `${calcule.amount} Mt`;
    document.getElementById("amount").value = calcule.amount;
    document.getElementById("account").value = calcule.account;
    document.getElementById("expireDay").textContent = calcule.expireAt;
    document.getElementById("income").textContent = `${calcule.income} Mt`;
    document.getElementById("totalIncome").textContent = `${calcule.totalIncome} Mt`;
  }
  g();
  amounts.addEventListener("input", g);
  accounts.addEventListener("input", g);
  btnGateway.forEach((btn)=>{
    btn.addEventListener("change", (btn)=>{
      accounts.accessKey = btn.target.accessKey;
      document.getElementById("gateway").value = btn.target.value;
    });
  });
});