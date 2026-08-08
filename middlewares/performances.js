const {Actions} = require("./action");
const {cardDatas} = require("./utils");
module.exports.performance = async (arryFields, filterBy) => {
  const transactionsMap = {};
  for (const field of arryFields) {
    const key = field === "users" ?  "upline" : "owner";
    const query = filterBy ?  {[key] : filterBy} : null;
    if(!/^(earnings|payouts)$/i.test(field)){
      transactionsMap[field] = await Actions.get(field, query);
    }
  }
  let datasCard = [];
  let chartCard = null;
  for(let field of arryFields){
    if(/^(users|deposits|withdrawals|commissions)$/i.test(field)){
      const data = transactionsMap[field] ? transactionsMap[field] : [];
      const f = await cardDatas(data,field, "pt-PT");
      const k = await f.getTotals();
      datasCard.push(k);
    }
    if(/^(earnings|payouts)$/i.test(field)){
      let dataEarn = datasCard.filter((item)=>{
        if(/^(deposits|commissions)$/i.test(item.field.default)) return true;
      });
      let f = await cardDatas(dataEarn, field);
      const j = await f.getGarnings();
      j.last12Months = JSON.stringify(j.last12Months);
      chartCard = j;
    }
  }
  for(let y in datasCard){datasCard[y].last12Months = JSON.stringify(datasCard[y].last12Months);}
  return {
    cards: datasCard,
    chart: chartCard
  }
};