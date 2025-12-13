const express = require("express");
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');

const cabinet = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const {transformDatas,getTime,objRevised,propertysLength,statusIcons,msgsStatus,formatDate,sortByDays,expireDay,cardDatas} = require('../middlewares/utils');
const {pagination} = require('../middlewares/pagination');
const {Actions} = require('../middlewares/action');
const {authUser} = require("../middlewares/authentication");


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
  let datas =[
    {
      _id:"47dd5",
      src:"/imgs/logo1.png",
      name:"Standard",
      percentage:4,
      maturity:30,
      min:1500.00,
      max:1000000.01,
      status: true,
    }]
    for(let d in datas){
      const nesterDatas ={
        admin: false,
        distac: datas[0] == 0? true : false
      }
      datas[d] = await transformDatas(objRevised(datas[d],nesterDatas),true);
    }
  res.status(200).render("cabinet/fleets",{fleets:datas});
});

cabinet.get("/deposit", authUser, urlencodedParser, async (req,res)=>{
  const {fleetId} = req.query;
  //const fleet = await Actions.get("fleets",fleetId);
  //const gateways = await Actions.get("gateways",{status:true});
 /*
 if(typeof fleet == "object" && typeof gateways == "array"){
    res.render("cabinet/new-deposit",{fleet:fleet,gateways:gateways});
  }else{
    req.flash("Erro! Esta frota está indisponível");
    res.status(200).redirect("/fleets");
  }*/
  const datas ={
      _id:0,
      src:"/imgs/logo1.png",
      name:"Standard",
      percentage:4,
      maturity:30,
      min:1500.00,
      max:1000000.00,
      status: true,
      distac:false,
      admin:false
    }
    
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
  res.render("cabinet/new-deposit",{fleet:datas,gateways:d});

});

cabinet.post("/newdeposit", authUser, urlencodedParser, async (req,res)=>{
  const bodys = await transformDatas(req.body);
  const fleet = await Actions.get("fleets",bodys.fleet);
  let results;
  class NewDeposit{
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
  if(typeof fleet == "object"){
    const deposit = new NewDeposit(bodys,fleet);
    const datas = {
      type:"set",
      redirect:`/cabinetdeposits`,
      collection:"deposits",
      data:deposit
    }
    try{
     const newdeposit = await Actions.set(datas);
    }catch(error){
      console.log(error);
      
    }
  }
  console.log(new NewDeposit(bodys))
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

let a = [{
      name:"Antonio",
  status:"Pendente",
  amount:200,
  gateway:{
    name:"Mcash",
  },
  date:["09",10,2025,"12:33:33"]
},{
  name:"Antonio",
  amount:100,
  status:"Rejeitado",
  gateway:{
    name:"Vodacom",
  },
  date:["09",10,2025,"12:33:33"]
},{
  name:"Antonio",
  amount:200009,
  status:"Comcluido",
  gateway:{
    name:"Vodacom",
  },
  date:["10","09",2025,"12:33:33"]
},{
  name:"Antonio",
  amount:200009,
  status:"Comcluido",
  gateway:{
    name:"Vodacom",
  },
  date:["09","09",2025,"12:33:33"]
}];

cabinet.get("/transactions/:type", authUser, urlencodedParser, async (req,res)=>{
  const type = req.params.type;
  const link = {path:`/cabinet/transactions/${type}`,queryString: req.query ? `${new URLSearchParams(req.query).toString()}` : ''};
  const body = await transformDatas(req.query);
  let querys = propertysLength(body) > 0 ? body : null;

  if(/^(deposits|commissions|withdrawals)/i.test(type)){
    let results = await Actions.get(type, querys,["gateways"]);
    if(a){
      
      for(let i in a){
        const nesterDatas = {
          mode:"cabinet",
          types:transTypes[type],
          transaction_type: type,
          icon :statusIcons[a[i].status],
        }
        a[i] = await transformDatas(a[i],true,nesterDatas);
      }
    }
    console.log(a)
    a.sort(sortByDays);
    
    const datas= (pagination(a,!body.page?0:body.page, link, true));
    res.render("cabinet/transactions",{type:type, title:transTypes[type], datas:datas});
  }else{
    const g = objRevised(alertDatas, {texts:"Esse tipo de transações não existe!"});
    res.render("cabinet/catchs", g);
  }
});

cabinet.get("/transactions/:type/view", authUser, urlencodedParser, async (req,res)=>{
  const {type} = req.params;
  const {_id} = req.query;
  
  
  class NewDeposit{
    constructor(){
      this.owner = "222331355";
      this.amount = 200;
      this.income = (this.amount * (50 /100));
      this.totalIncome = this.amount + this.income;
      this.fleet ={
        name:"Standard",
        _id: "33ee"
      };
      this.status = "Pendente";
      this.account="843434027",
      this.gateway= {
        src:"/imgs/images.png",
        _id:2,
        paymentInstantly:true,
        name:"Vodacom",
        account:"8423343402",
        owner:"Felix Zanfa"
      };
      this.date = getTime().fullDate;
      this.expireAt =  expireDay(15);
    }
  }
  let datas = new NewDeposit();
  const isDeposit = type === "deposits" && datas.status === "Emprogresso" && formatDate(datas.expireAt).secondsLength >= 0 ? "Comcluido" : "Emprogresso";
  const nesterDatas ={
    isAdmin: false,
    shows: msgsStatus(datas.status,type),
    [type]: true,
    transaction_type:type,
    type: transTypes[type],
    contact_us: /^(Rejeitado|Anulado)$/i.test(datas.status),
  }
  if(type === "deposits"){
    nesterDatas.showsBtn = {
      default: datas.status === "Pendente" && type === "deposits"? true : false,
      status: datas.status === "Rejeitado" ? true : false
    }
  }
  
  const showBtns =!/^(Comcluido|Anulado)$/i.test(datas.status);
  const btnsArray = [
    {value: isDeposit === "Emprogresso"? "Confirmar" : "Processar", action: isDeposit ? isDeposit : "Comcluido", icon:"bi bi-check-circle"},
    {value: "Rejeitar",action:"Rejeitado",icon:"bi bi-slash-circle"},
    {value: "Anular",action:"Anulado",icon:"bi bi-arrow-left-circle"}
  ];
  datas =  await transformDatas(datas,true,nesterDatas);
  console.log(datas)
  res.render("cabinet/transactionCard",{type:type, _id:_id, btns: showBtns? btnsArray : null ,datas: datas});
});


cabinet.get("/edit-profile", authUser, (req, res)=>{
  const {redirectTo} = req.query;
  res.render("cabinet/edit-profile",{redirectTo:redirectTo});
});

cabinet.post("/edit-profile", authUser, urlencodedParser, async(req,res)=>{
  const {_id,redirectTo} = req.query;
  const bodys = await transformDatas(req.body);
  console.log(bodys)
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
    data:{cronTodelete: type? expireDay(30) : ""}
  }
  const account = await Actions.get("users",_id);
  if(account){
    const result = await Actions.update(_id,datas);
    if(result.type == "success"){
      if(type){const send = await sendEmail(account, "requestdeleteaccount");}
    }
    req.flash(results.type, results.text);
    res.redirect(302,results.redirect);
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