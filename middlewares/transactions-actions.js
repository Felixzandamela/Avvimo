const {getTime, expireDay, objRevised} = require("./utils");
const {Actions} =  require("./action");
module.exports.confirmDeposit = async function(bodys,internal){
  if(!bodys) return null;
  class Deposit{
    constructor(body,fleet){
      this.amount = body.amount;
      this.income = (body.amount * (fleet.percentage /100));
      this.totalIncome = this.amount + this.income;
      this.status = "Emprogresso";
      this.date = getTime().fullDate;
      this.expireAt = expireDay(fleet.maturity);
    }
  }
  class Commission{
    constructor(from){
      this.amount= Math.round(from.amount * (5 / 100));
      this.totalReceivable = this.amount;
      this.status = "Comcluido";
      this.date = getTime().fullDate;
    }
  }
  let deposit = await Actions.get("deposits",bodys._id,["fleet"]);
  if(deposit){
    let newDatasDeposit = internal? {status: "Emprogresso"} : new Deposit(bodys,deposit.fleet);
    const datas = {
      type:"update",
      collection:"deposits",
      redirect: `/admin/transactions/deposits/view?_id=${deposit._id}`,
      data: newDatasDeposit,
    }
    const updateDeposit = await Actions.update(deposit._id,datas,true);
    if(updateDeposit){
      let commission = await Actions.get("commissions",updateDeposit.from);
      if(commission){
        const newDatasCommission = new Commission(updateDeposit);
        commission = objRevised(commission,newDatasCommission);
        const updateComission = await commission.save();
        //increment balance user
        //collection, id, key, val
        const newBalance = await Actions.increment("users", commission.owner, "balance", commission.totalReceivable);
        if(newBalance){return true;}
      }else{return true}
    }else{ return null}
  }else{return null}
}
  