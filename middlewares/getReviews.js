const {Actions} = require("./action");
const {transformDatas} = require("./utils");
const { pagination } = require('../middlewares/pagination');

module.exports.getReviews = async function(mode, body, link){
  const isAdmin = mode === "admin";
  const hasData = body.makePublic;
  console.log(hasData)
  const query = !isAdmin? {makePublic:true} : hasData === undefined ? null : {makePublic: body.makePublic};
  console.log(query)
  let results = await Actions.get("reviews",query,["owner"]);
  let filteredData = [];
  if(results){
    for(let k in results){
      let item = results[k];
      results.owner = {
        _id: item.owner._id,
        name: item.owner.name,
        src: item.owner.src
      }
      results[k] = await transformDatas(item._doc,true);
    }
    filteredData = (pagination(results,!body.page?0:body.page, link, false));
  }
  return filteredData;
}