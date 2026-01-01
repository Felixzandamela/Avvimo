const express = require("express");
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const {sendEmail} = require('../middlewares/sendEmail');
const cabinet = express.Router();
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ limit: '50mb',extended: true });
const {transformDatas,getTime,objRevised,propertysLength,statusIcons,msgsStatus,formatDate,sortByDays,expireDay,cardDatas} = require('../middlewares/utils');
const {getTransactions,getTransaction,getAccounts} = require("../middlewares/transactions-actions");
const {pagination} = require('../middlewares/pagination');
const {Actions} = require('../middlewares/action');
const {getFleets} = require("../middlewares/getFleets");


const alertDatas = {
  type:"error",
  title:"Erro!",
  texts: "Houve um erro, por favor tente mais tarde. Se o erro persistir, por favor contacte-nos atrás dos nossos canaís.",
  btnTitle: "Voltar atrás",
  redirectTo: null
}
const isGatawayCurrect = function(name,account){
  return /^(Vodacom|Mpesa|M-pesa)$/i.test(name) && !account.match(/^8[45]\d{7}$/) || /^(E-mola|Emola|Movitel)$/i.test(name) && !account.match(/^8[67]\d{7}$/) || /^(Mcash|M-cash|Tmcel)$/i.test(name) && !account.match(/^8[23]\d{7}$/) || /^(Ponto24|SimoRede)$/i.test(name) && !account.match(/^8[234567]\d{7}$/);
}
cabinet.get("/", (req,res)=>{
  res.redirect(301, "/cabinet/dashboard");
  //res.redirect("/transactions/deposits/view?id=");
});
cabinet.get('/dashboard', async (req, res) => {
  
  const transactionsMap = {
    deposits: await Actions.get("deposits",{owner: req.user._id}),
    withdrawals: await Actions.get("withdrawals",{owner: req.user._id}),
    commissions: await Actions.get("commissions",{owner: req.user._id})
  }
  
  
  const performance = async function(){
    let datasCard = [];
    let earnCard = null;
    const arryFields = ["deposits","withdrawals","commissions","earnings"];
    for(let z in arryFields){
      if(/^(deposits|withdrawals|commissions)$/i.test(arryFields[z])){
        const data = transactionsMap[arryFields[z]] ? transactionsMap[arryFields[z]] : [];
        const f = await cardDatas(data,arryFields[z], "pt-PT");
        const k = await f.getTotals();
        datasCard.push(k);
      }
      if("earnings" === arryFields[z]){
        let dataEarn = datasCard.filter((item)=>{
          if(/^(deposits|commissions)$/i.test(item.field.default)) return true;
        });
        let f = await cardDatas(dataEarn);
        const j = await f.getGarnings();
        j.last12Months = JSON.stringify(j.last12Months);
        earnCard = j;
      }
    }
    for(let y in datasCard){datasCard[y].last12Months = JSON.stringify(datasCard[y].last12Months);}
    return {
      cards: datasCard,
      earns: earnCard
    }
  }
  const renderCards = await performance();
  //console.log(renderCards)
  res.status(200).render("cabinet/dashboard",renderCards);
});

cabinet.get('/fleets', urlencodedParser, async (req, res) => {
  const datas = await getFleets("cabinet");
  res.status(200).render("cabinet/fleets",{fleets:datas});
});

cabinet.get("/deposit", urlencodedParser, async (req,res)=>{
  const {fleetId} = req.query;
  const fleet = await Actions.get("fleets",fleetId);
  const gateways = await Actions.get("gateways",{status:true});
  if(fleet && gateways){
    res.render("cabinet/new-deposit",{fleet:fleet,gateways:gateways});
  }else{
    req.flash("Erro! Esta frota não está disponível");
    res.status(200).redirect("/fleets");
  }
});

cabinet.post("/deposit", urlencodedParser, async (req,res)=>{
  const bodys = await transformDatas(req.body);
  const fleet = await Actions.get("fleets",bodys.fleet);
  const [cashback] = await Actions.get("gateways",{name:"Cashback"});
  class Deposit{
    constructor(body,fleet){
      this.owner = req.user._id;
      this.amount = body.amount;
      this.income = (body.amount * (fleet.percentage /100));
      this.totalIncome = this.amount + this.income;
      this.fleet = fleet._id;
      this.status = "Pendente";
      this.account=body.account,
      this.gateway= body.gateway
      this.date = getTime().fullDate;
      this.expireAt = expireDay(fleet.maturity);
    }
  }
  
  class Commission{
    constructor(owner,from,cashback){
      this.owner= owner;
      this.amount= Math.round(from.amount * (5 / 100));
      this.totalReceivable = this.amount;
      this.fees = 0;
      this.status = "Pending";
      this.from = from._id;
      this.commissionedBy = from.owner;
      this.gateway = cashback._id;
      this.account = cashback.account;
      this.date = getTime().fullDate;
    }
  }
  if(fleet && cashback){
    const deposit = new Deposit(bodys,fleet);
    const datas = {
      type:"set",
      redirect:`/cabinet/fleets`,
      collection:"deposits",
      data: deposit
    }
    try{
      const newDeposit = await Actions.set(datas, null, true);
      if(newDeposit){
        datas.redirect = `/cabinet/transactions/deposits/view?_id=${newDeposit._id}`;
        if(req.user.upline){
          const [upline] = await Actions.get("users",req.user.upline);
          if(upline){
            const commission =  new Commission(req.user.upline, newDeposit, cashback);
            datas.collection = "commissions";
            datas.data = commission;
            const results = await Actions.set(datas);
            res.redirect(results.redirectTo);
          }else{
            res.redirect(datas.redirect);
          }
        }else{
          res.redirect(datas.redirect);
        }
      }else{
        req.flash("error", "Houve um erro ao processar deposíto");
        res.redirect(datas.redirect);
      }
    }catch(error){
      console.error(error);
      req.flash("error", "Houve um erro internal ao processar deposíto");
      res.redirect(datas.redirect);
    }
  }else{
    req.flash("error", "Houve um erro ao buscar frota");
    res.redirect("/cabinet/fleets");
  }
});

cabinet.get("/withdraw", urlencodedParser, async (req,res)=>{
  const gateways = await Actions.get("gateways",{status:true});
  const accounts = await getAccounts(req.user, true);
  if(gateways){
    res.render("cabinet/new-withdraw",{gateways:gateways, accounts: accounts});
  }else{
    res.status(200).render("cabinet/catchs", alertDatas);
  }
});

cabinet.post("/newwithdraw", urlencodedParser, async (req,res)=>{
  const bodys = await transformDatas(req.body);
  const user = req.user;
  const accounts = await getAccounts(req.user, true);
  const gateway = await Actions.get("gateways", bodys.gateway);
  
  const account = accounts.filter((item)=>{if(item.account === `${bodys.account}` || `${item.account}` === bodys.account){return true;}});

  class NewWithdraw{
    constructor(body, user){
      this.owner = user._id;
      this.amount = !bodys.amount ? 0 :  parseFloat(bodys.amount);
      this.fees =  Math.round(this.amount * (6 / 100));
      this.totalReceivable = (this.amount - this.fees).toFixed(2);
      this.status = "Pendente";
      this.account = body.account,
      this.gateway = body.gateway
      this.date = getTime().fullDate;
    }
  }
  const withdraw = new NewWithdraw(bodys, user);
  const datas = {
    type: "set",
    redirect: `/cabinet/transactions/withdrawals`,
    collection: "withdrawals",
    data: withdraw
  }
  try{
    console.log(accounts)
    const d = {
      amountMatch:bodys.amount > user.balance,
      amountPass50: bodys.amount < 50,
      accountMadeDeposit : accounts.length <=0,
      isGatawayCurrect: !gateway || isGatawayCurrect(gateway.name, bodys.account)  
    }
    
    console.log(d)
    if(bodys.amount > user.balance || bodys.amount  < 50 || account.length <= 0 ||  isGatawayCurrect(gateway.name, bodys.account)){
      console.log("o error ta aqui")
      console.log(bodys)
      res.status(200).render('cabinet/catchs', alertDatas);
    }else{
      const results = await Actions.set(datas, null, true);
      console.log("results:", results)
      if(results){
        const updateBalance = await Actions.decrement("users", withdraw.owner, 'balance', withdraw.amount);
        if(!updateBalance){res.status(200).render('cabinet/catchs', alertDatas);}
        res.redirect(`/cabinet/transactions/withdrawals/view?_id=${results._id}`);
      }else{res.status(200).render('cabinet/catchs', alertDatas);}
    }
  }catch(error){
    console.log(error);
    res.status(200).render('cabinet/catchs', alertDatas);
  }
});



cabinet.get("/transactions/:type", urlencodedParser, async (req,res)=>{
  const type = req.params.type;
  const link = {path:`/cabinet/transactions/${type}`,queryString: req.query ? `${new URLSearchParams(req.query).toString()}` : ''};
  const body = await transformDatas(req.query);
  const result = await getTransactions("cabinet",body,type,req.user);
  let datas = !result.successed ? objRevised(alertDatas, result) : result;
  res.render( !datas.successed ? "cabinet/catchs" : "cabinet/transactions",datas);
});

cabinet.get("/transactions/:type/view",  urlencodedParser, async (req,res)=>{
  const {type} = req.params;
  const {_id} = req.query;
  let datas = await getTransaction("cabinet", type, _id);
  res.render(!datas.successed ? "cabinet/catchs" : "cabinet/transactionCard", datas);
});


cabinet.get("/edit-profile", (req, res)=>{
  const {redirectTo} = req.query;
  res.render("cabinet/edit-profile",{redirectTo:redirectTo});
});

cabinet.post("/edit-profile", urlencodedParser, async(req,res)=>{
  const {_id,redirectTo} = req.query;
  const bodys = await transformDatas(req.body);
  const datas = {
    type:"update",
    redirect:redirectTo,
    collection:"users",
    data:bodys
  }
  const results = await Actions.update(_id,datas);
  if(results){
    req.flash(results.type, results.text);
    res.redirect(302,results.redirect);
  }
});

cabinet.post("/account_action", urlencodedParser, async(req,res)=>{
  const bodys = await transformDatas(req.body);
  const {_id,type} = bodys;
  const datas = {
    type:"update",
    redirect: `/cabinet/dashboard`,
    collection: "users",
    data:{cronTodelete: type? expireDay(30) : []}
  }
  const account = await Actions.get("users",_id);
  if(account){
    const results = await Actions.update(_id,datas);
    const {type,text,redirect} = results;
    if(results.type == "success"){
      if(type){const send = await sendEmail(account, "requestdeleteaccount");}
    }
    req.flash(type, `${text}`);
    res.redirect(redirect);
  }else{
    req.flash("error", "Este usuarío não está disponível");
    res.redirect(datas.redirect);
  }
});


cabinet.get("/payment",  urlencodedParser, async(req, res)=>{
  const {_id} = req.query;
  console.log(_id)
});

module.exports = cabinet;