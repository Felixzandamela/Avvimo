const {Actions} = require("./action");

module.exports.getUsersToEmail = async function(type){
  const options = [ 
    {
      $lookup: {
        from: "deposits",
        localField: "_id",
        foreignField: "owner",
        as: "deposits"
      }
    }
  ];
  switch(type){
    case "notMadeDeposit":
      options.push({$match: {"deposits.status": { $nin: ["EmProgresso", "Concluido"] }}});
      return await Actions.aggregate("users", options);
    break;
    case "madeDeposit": 
      options.push({$match: {"deposits.status": { $in: ["EmProgresso", "Concluido"] }}});
      return await Actions.aggregate("users", options);
    break;
    case "all":
      return await Actions.get("users");
    break;
    default: 
      if(typeof type === "object" && !Array.isArray(type)){
        return await Actions.get("users", type);
      }else{
        return [];
      }
    break;
  }
}