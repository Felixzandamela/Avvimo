const {formatDate} = require('./utils');
module.exports.organizeByDate = (datas) => {
  const datesMap = {};
  datas.forEach(data => {
    const formattedDate = data.date.onlyDate ? data.date.onlyDate: formatDate(data.date).onlyDate;
    if (!datesMap[formattedDate]) {
      datesMap[formattedDate] = [];
    }
    datesMap[formattedDate].push(data);
  });
  const organizedData = Object.keys(datesMap).map((date, data )=> {
    return {
      date:date,
      datas: datesMap[date]
    }
  })
  return organizedData;
}// organize Datas by date