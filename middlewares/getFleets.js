const {Actions} = require("./action");
const {objRevised,transformDatas} = require("./utils");
module.exports.getFleets = async function(mode){
  let query = mode === "admin"? null : {status: true};
  
  let fleets = await Actions.get("fleets", query);
  if(fleets){
    let total = 0;
    for(let f in fleets){
      let item = fleets[f]._doc;
      let perfo = await Actions.aggregate("deposits",{status: { $in: ["Completo", "Emprogresso"] }, fleet: item._id }, "$amount");
      if(perfo){total += perfo.total;
      item = objRevised(item,perfo);
      }else{
       item = objRevised(fleets[f],{total:0,count:0});
      }
    }
    const popular = fleets.reduce((great, current) => current.total > great.total ? current : great, fleets[0]);
    for(let h in fleets){
      let item = fleets[h]._doc;
      const nesterDatas = {
        admin: mode == "admin" ? true : false,
        distack: item._id !== popular._id ? false : true,
        percentages: isNaN((item.total * 100) / total) ? 0 : parseFloat((item.total * 100) / total).toFixed(2)
      }
      fleets[h] = await transformDatas(objRevised(item,nesterDatas),true);
    }
    return fleets;
  }else{ return null}
}