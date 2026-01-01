const {Actions} = require("./action");
const {objRevised,transformDatas} = require("./utils");
module.exports.getFleets = async function(mode){
  let query = mode === "admin"? null : {status: true};
  
  let fleets = await Actions.get("fleets", query);
  
  if(fleets){
    let total = 0;
    for(let f in fleets){
      let item = fleets[f]._doc;
      let perfo = await Actions.get("deposits",{status: { $in: ["Concluido", "EmProgresso"] }, fleet: item._id });
      
      if(perfo){
        const totalDepositsAmount = perfo.reduce((acc, curr) => acc + curr.amount, 0);
        total += totalDepositsAmount;
        item.total = total;
      }else{
       item.total = 0;
      }
    }
    const popular = fleets.reduce((great, current) => current.total > great.total ? current : great, fleets[0]);
    for(let h in fleets){
      let item = fleets[h]._doc;
      const nesterDatas = {
        _id: fleets[h]._id,
        admin: mode == "admin" ? true : false,
        distack: item._id !== popular._id ? false : true,
        percentages: isNaN((item.total * 100) / total) ? 0 : parseFloat((item.total * 100) / total).toFixed(2)
      }
      fleets[h] = await transformDatas(objRevised(item,nesterDatas),true);
    }
   console.log(fleets)
    return fleets;
  }else{ return null}
}