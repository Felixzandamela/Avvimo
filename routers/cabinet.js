const express = require("express");
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const {sendEmail} = require('../middlewares/sendEmail');
const cabinet = express.Router();
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ limit: '50mb',extended: true });
const {transformDatas,getTime,objRevised,propertysLength,statusIcons,msgsStatus,formatDate,sortByDays,expireDay,cardDatas} = require('../middlewares/utils');
const {pagination} = require('../middlewares/pagination');
const {Actions} = require('../middlewares/action');
const {authUser} = require("../middlewares/authentication");
const {getFleets} = require("../middlewares/getFleets");


const alertDatas = {
  type:"error",
  title:"Erro!",
  texts: "Houve um erro, por favor tente mais tarde. Se o erro persistir, por favor contacte-nos atrás dos nossos canaís.",
  btnTitle: "Painel",
  redirectTo: "/cabinet/dashboard"
}

const transTypes = {
  deposits:"Deposíto",
  withdrawals:"Saques",
  commissions:"Comissão"
}


cabinet.get("/", (req,res)=>{
  res.redirect(301, "/cabinet/dashboard");
  //res.redirect("/transactions/deposits/view?id=");
});
cabinet.get('/dashboard', authUser, async (req, res) => {
  let datas ={
    deposits:[{
      name:"Antonio",
  status:"Pendente",
  amount:200,
  income:300,
  gateway:{
    name:"Mcash",
  },
  date:["09",10,2025,"12:33:33"]
},{
  name:"Antonio",
  amount:100,
  income:300,
  status:"Rejeitado",
  gateway:{
    name:"Vodacom",
  },
  date:["09",10,2025,"12:33:33"]
},{
  name:"Antonio",
  amount:2000,
  income:3000,
  status:"Comcluido",
  gateway:{
    name:"Vodacom",
  },
  date:["10","15",2025,"12:33:33"]
},
{
  name:"Antonio",
  amount:2000,
  income:3000,
  status:"Comcluido",
  gateway:{
    name:"Vodacom",
  },
  date:["10","17",2025,"12:33:33"]
},
{
  name:"Antonio",
  amount:1500,
  income:3000,
  status:"Comcluido",
  gateway:{
    name:"Vodacom",
  },
  date:["09","16",2025,"12:33:33"]
}],
  withdrawals: [{
  name:"Antonio",
  amount:100,
  status:"Rejeitado",
  gateway:{
    name:"Vodacom",
  },
  date:["09",10,2025,"12:33:33"]
},{
  name:"Antonio",
  amount:2000,
  status:"Comcluido",
  gateway:{
    name:"Vodacom",
  },
  date:["10","24",2025,"12:33:33"]
},
{
  name:"Antonio",
  amount:2000,
  status:"Comcluido",
  gateway:{
    name:"Vodacom",
  },
  date:["10","24",2025,"12:33:33"]
}],
  commissions:[{
  name:"Antonio",
  amount:100,
  status:"Comcluido",
  gateway:{
    name:"Vodacom",
  },
  date:["09",10,2025,"12:33:33"]
},
{
  name:"Antonio",
  amount:200,
  status:"Comcluido",
  gateway:{
    name:"Vodacom",
  },
  date:["10","14",2025,"12:33:33"]
}],
  users:[{
  name:"Antonio",
  amount:100,
  status:"Comcluido",
  gateway:{
    name:"Vodacom",
  },
  date:["09",10,2025,"12:33:33"]
},{
  name:"Antonio",
  amount:2000,
  status:"Comcluido",
  gateway:{
    name:"Vodacom",
  },
  date:["10","14",2025,"12:33:33"]
},
{
  name:"Antonio",
  amount:2000,
  status:"Comcluido",
  gateway:{
    name:"Vodacom",
  },
  date:["10","16",2025,"12:33:33"]
}]
}
const performance = async function(){
  let datasCard = [];
  let earnCard = null;
  const arryFields = ["deposits","withdrawals","commissions","earnings"];
  for(let z in arryFields){
    if(/^(deposits|withdrawals|commissions)$/i.test(arryFields[z])){
      const data = datas[arryFields[z]] ? datas[arryFields[z]] : [];
      const f = await cardDatas(data,arryFields[z], "pt-PT");
      const k = await f.getTotals();
      datasCard.push(k)
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
  
  for(let y in datasCard){
    datasCard[y].last12Months = JSON.stringify(datasCard[y].last12Months);
  }
  //console.log(datasCard)
  return {
    cards: datasCard,
    earns: earnCard
  }
}
 const renderCards = await performance();
//console.log(renderCards)
  res.status(200).render("cabinet/dashboard",renderCards);
});

cabinet.get('/fleets', authUser, urlencodedParser, async (req, res) => {
  const datas = await getFleets();
  res.status(200).render("cabinet/fleets",{fleets:datas});
});

cabinet.get("/deposit", authUser, urlencodedParser, async (req,res)=>{
  const {fleetId} = req.query;
  const fleet = await Actions.get("fleets",fleetId);
  const gateways = await Actions.get("gateways",{status:true});
  if(fleet && gateways){
    res.render("cabinet/new-deposit",{fleet:fleet,gateways:gateways});
  }else{
    req.flash("Erro! Esta frota está indisponível");
    res.status(200).redirect("/fleets");
  }
});

cabinet.post("/deposit", authUser, urlencodedParser, async (req,res)=>{
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

cabinet.get("/withdraw", authUser, urlencodedParser, async (req,res)=>{
  //const gateways = await Actions.get("gateways",{status:true});
 /*
 if(typeof fleet == "object" && typeof gateways == "array"){
    res.render("cabinet/new-deposit",{fleet:fleet,gateways:gateways});
  }else{
    req.flash("Erro! Esta frota está indisponível");
    res.status(200).redirect("/fleets");
  }*/
  
    
    const d =[
      {
        name:"Vodacom",
        _id:1,
        src:"/imgs/images.png"
      },
      {
        name:"Movitel",
        _id:2,
        src:"/imgs/images.png"
      }
      ]
  res.render("cabinet/new-withdraw",{gateways:d});

});

cabinet.post("/newwithdraw", authUser, urlencodedParser, async (req,res)=>{
  const bodys = await transformDatas(req.body);
  let results, user = req.user;
  class NewWithdraw{
    constructor(body, user){
      this.owner = ""; // user.id;
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
    redirect: `/cabinet/withdrawals`,
    collection: "withdrawals",
    data: withdraw
  }
  try{
    if(req.user){
      
    }
    results = await Actions.set(datas);
    if(results.type == "success"){
      const updateBalance = await Actions.decrement("users", withdraw.owner, 'balance', withdraw.amount);
      if(updateBalance){
        
      }else{
        
      }
    }else{
      const a = objRevised(alertDatas,{redirectTo:"/cabinet/withdraw", btnTitle:"Voltar atrás"});
      res.status(200).render('cabinet/catchs', a);
    }
  }catch(error){
    console.log(error);
    const a = objRevised(alertDatas,{redirectTo:"/cabinet/withdraw", btnTitle:"Voltar atrás"});
    res.status(200).render('cabinet/catchs', a);
  }
});



cabinet.get("/transactions/:type", authUser, urlencodedParser, async (req,res)=>{
  const type = req.params.type;
  const link = {path:`/cabinet/transactions/${type}`,queryString: req.query ? `${new URLSearchParams(req.query).toString()}` : ''};
  const body = await transformDatas(req.query);
  let querys = propertysLength(body) > 0 ? body : null;

  if(/^(deposits|commissions|withdrawals)/i.test(type)){
    let results = await Actions.get(type, querys,["gateway"]);
    if(results){
      
      for(let i in results){
        const nesterDatas = {
          mode:"cabinet",
          types:transTypes[type],
          transaction_type: type,
          icon :statusIcons[results[i].status],
        }
        results[i] = await transformDatas(results[i]._doc,true,nesterDatas);
      }
      results.sort(sortByDays);
    }
    const datas= (pagination(results,!body.page?0:body.page, link, true));
    res.render("cabinet/transactions",{type:type, title:transTypes[type], datas:datas});
  }else{
    const g = objRevised(alertDatas, {texts:"Esse tipo de transações não existe!"});
    res.render("cabinet/catchs", g);
  }
});

cabinet.get("/transactions/:type/view", authUser, urlencodedParser, async (req,res)=>{
  const {type} = req.params;
  const {_id} = req.query;
  let datas = await Actions.get(type,_id,["fleet","gateway"]);
  if(datas){
    const isDeposit = type === "deposits" && datas.status === "Emprogresso" && datas.expireAt.secondsLength >= 0;
    const nesterDatas ={
      isAdmin: false,
      shows: msgsStatus(datas.status,type),
      paymentyInfo: !/^(Anulado|Emprogresso|Comcluido)$/i.test(datas.status),
      [type]: true,
      transaction_type:type,
      type: transTypes[type],
      contact_us: /^(Rejeitado|Anulado)$/i.test(datas.status),
    }
    if(type === "deposits"){
      nesterDatas.showsBtn = {
        default: datas.status === "Pendente" && type === "deposits" && datas.gateway.paymentInstantly ? true : false,
        status: datas.status === "Rejeitado" && type === "deposits" && datas.gateway.paymentInstantly ? true : false
      }
    }
    const showBtns = /^(Comcluido|Anulado)$/i.test(datas.status) ||  datas.expireAt.secondsLength > 0 ;
    
    const btnsArray = [
      {value: isDeposit === "Emprogresso"? "Confirmar" : "Processar", action: isDeposit ? isDeposit : "Comcluido", icon:"bi bi-check-circle"},
      {value: "Rejeitar",action:"Rejeitado",icon:"bi bi-slash-circle"},
      {value: "Anular",action:"Anulado",icon:"bi bi-arrow-left-circle"}
    ];
    let a =  await transformDatas(datas._doc,true);
    a = objRevised(a,nesterDatas);
   
    res.render("cabinet/transactionCard",{ btns: !showBtns? null : btnsArray ,datas:a});
  }else{
    const g = {
      btnTitle: "Voltar atrás",
      redirectTo: null,
      texts: "Essa transação esta indisponível"
    }
    const datas = objRevised(alertDatas,g);
    res.render("cabinet/catchs",datas);
  }
});


cabinet.get("/edit-profile", authUser, (req, res)=>{
  const {redirectTo} = req.query;
  res.render("cabinet/edit-profile",{redirectTo:redirectTo});
});

cabinet.post("/edit-profile", authUser, urlencodedParser, async(req,res)=>{
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

cabinet.post("/account_action", authUser, urlencodedParser, async(req,res)=>{
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


cabinet.get("/payment", authUser,  urlencodedParser, async(req, res)=>{
  const {_id} = req.query;
  console.log(_id)
});

module.exports = cabinet;