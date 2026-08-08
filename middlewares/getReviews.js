const {Actions} = require("./action");
const {transformDatas} = require("./utils");
const { pagination } = require('../middlewares/pagination');

module.exports.getReviews = async function(mode, body, link){
  const isAdmin = mode === "admin";
  const hasData = body.makePublic;
  const query = !isAdmin? {makePublic:true} : hasData === undefined ? null : {makePublic: body.makePublic};
  let results = await Actions.get("reviews",query,["owner"]);
  let filteredData = [], datas = [];
  if(results){
    for(let k in results){
      let item = results[k];
      let review = {
        owner: {
          _id: item.owner._id,
          name: item.owner.name,
          src: item.owner.src ,
        },
        _id: item._id,
        stars: item.stars,
        text: item.text,
        makePublic: item.makePublic,
        date: item.date
      }
      review = await transformDatas(review,true);
      datas.push(review);
    }
    filteredData = (pagination(datas,!body.page?0:body.page, link, false));
  }
  return filteredData;
}