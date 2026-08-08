const {Actions} = require("./action");
const {objRevised,transformDatas, getScheduleEvent} = require("./utils");
module.exports.getFleets = async function(mode, _id){
  let query = mode === "admin" ? null : {status: true};
  const isPromotion = getScheduleEvent();
  let fleets = null;
  if(_id){
    fleets = await Actions.get("fleets",_id+"");
    if(isPromotion && fleets){
      fleets = objRevised(fleets, {percentage: fleets.percentage + isPromotion.percentage});
    }
  }else{
    fleets = await Actions.get("fleets", query);
    if(fleets){
      let total = 0, amount = 0;
      for(let f in fleets){
        let item = fleets[f]._doc;
        let depositsOfThisFleet = await Actions.get("deposits",{status: { $in: ["Concluido", "EmProgresso"] }, fleet: item._id });
        if(depositsOfThisFleet){
          const totalDepositsAmount = depositsOfThisFleet.reduce((acc, curr) => acc + curr.amount, 0);
          total += depositsOfThisFleet.length;
          amount += totalDepositsAmount;
          item.deposits = {
            total: depositsOfThisFleet.length,
            amount: totalDepositsAmount
          };
        }else{
          item.deposits = {
            total: 0,
            amount: 0
          };
        }
      }
      const popular = fleets.reduce((great, current) => current._doc.deposits.total > great._doc.deposits.total ? current : great, fleets[0]);
      for(let h in fleets){
        let item = fleets[h]._doc;
        const nesterDatas = {
          percentage: isPromotion? item.percentage + isPromotion.percentage : item.percentage,
          _id: fleets[h]._id,
          admin: mode === "admin",
          distack: item._id === popular._id,
          percentages:{
            total: isNaN((item.deposits.total * 100) / total) ? 0 : parseFloat((item.deposits.total * 100) / total).toFixed(2),
            amount: isNaN((item.deposits.amount * 100) / amount) ? 0 : parseFloat((item.deposits.amount * 100) / amount).toFixed(2)
          }
        }
        fleets[h] = await transformDatas(objRevised(item,nesterDatas),true);
      }
    }
  }
  return fleets;
}