const {getTime} = require("./utils");
function joinZero(number){return(number < 10 ? "0" + number : number).toString();}
module.exports.expireDay=(duration)=> {
  var date = new Date();   
  Date.prototype.addDays=function(days){   
    let day = new Date(this.valueOf()); day.setDate(date.getDate()+ days);
    return [joinZero(day.getMonth()), joinZero(day.getDate()), day.getFullYear(), getTime().onlyTime]
  }
  return date.addDays(duration)
}// get future date by assigning a value of dates
