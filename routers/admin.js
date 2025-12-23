const express = require("express");
const admin = express.Router();
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({limit: '50mb', extended: true });
const {asideLinks,transformDatas,sortByDays, objRevised, statusIcons, propertysLength,msgsStatus, formatDate} = require('../middlewares/utils');
const {pagination} = require('../middlewares/pagination');
const {Actions} = require('../middlewares/action');
const transactions = require('./transactions');
const {getFleets} = require("../middlewares/getFleets");
const {confirmDeposit} = require("../middlewares/transactions-actions");
const alertDatas = {
  type:"error",
  title:"Erro!",
  texts: "Houve um erro, por favor tente mais tarde. Se o erro persistir, por favor contacte-nos atrás dos nossos canaís.",
  btnTitle: "Painel",
  redirectTo: "/admin/dashboard"
}

const transTypes = {
  deposits:"Deposíto",
  withdrawals:"Saques",
  commissions:"Comissão"
}

admin.get('/', (req, res) => {
  res.redirect("/admin/dashboard");
});
admin.get('/dashboard', (req, res) => {
  res.status(200).render("cabinet/ad-dashboard");
});

admin.get('/fleets', urlencodedParser, async (req, res) => {
    const datas = await getFleets("admin");
    res.status(200).render("cabinet/fleets",{admin:true, fleets:datas});
});

admin.get("/gateways", async (req,res)=>{
  const datas = await Actions.get("gateways");
  res.status(200).render("cabinet/gateways", {gateways:datas});
});

admin.get('/:collection/action', urlencodedParser, async (req, res) => {
  const type = !req.query.type ? "set" : req.query.type;
  const _id = !req.query._id ? "" : req.query._id;
  const collection = req.params.collection;
  let itemToUpdate;
  
  if(type == "update"){
    let item = await Actions.get(collection,_id);
    if(item){itemToUpdate = item;}
  }
  const d = {
    text:{
      update:{
        gateways:"Atualizar gateway",
        fleets:"Atualizar frota"
      },
      set:{
        gateways:"Nova gateway",
        fleets: "Nova frota"
      }
    },
    view:{
      gateways:"cabinet/action-gateways",
      fleets:"cabinet/action-fleets"
    }
  }
  const datas = {
    admin:true,
    text:d.text[type][collection],
    type:type,
    _id: _id,
    view: d.view[collection],
    item: itemToUpdate
  }
  if(type == "update" && !datas.item){
    const data = {
      texts:`Este ${collection} com id ${_id} está indisponível. Por favor tente mais tarde`,
      btnTitle: "Voltar atrás",
      redirectTo: `/admin/${collection}`
    }
    const d = objRevised(alertDatas,data);
    res.status(404).render("cabinet/catchs",d);
  }else{
    res.status(200).render(datas.view,datas);
  }
});


admin.post('/:collection/action', urlencodedParser,async (req, res) => {
  const {type,_id} = req.query;
  const collection = req.params.collection;
  const bodys = await transformDatas(req.body);
  const datas = {
    type:type,
    redirect:`/admin/${collection}`,
    collection:collection,
    data:bodys
  }
  var results;
  if(!Actions[type]){
    req.flash("error", "Acão indisponível");
    res.status(404).redirect(`/admin/${collection}`);
  }else{
    const arg = type == "set"? [datas,{name:bodys.name}] : [_id,datas];
    const [first,second] = arg;
    results = await Actions[type](first,second);
  }
  if(results){
    req.flash(results.type, results.text);
    res.redirect(results.redirect);
  }
});



admin.get("/users", urlencodedParser, async(req,res)=>{
  const link = {path:`/admin/users`,queryString: req.query ? `${new URLSearchParams(req.query).toString()}` : ''};
  const body = await transformDatas(req.query);
  let querys = propertysLength(body) > 0 ? body : null;
  let results = await Actions.get("users", querys);
  
  if(results){
    for(let k in results){
      results[k] = await transformDatas(results[k]._doc,true);
    }
    results.sort(sortByDays);
    const datas= (pagination(results,!body.page?0:body.page, link, false));
    res.render("cabinet/users", {datas:datas});
  }else{
    res.render("cabinet/users", {datas:null});
  }
});

admin.get("/users/edit-profile", async(req,res)=>{
  const {_id} = req.query;
  const item = await Actions.get("users",_id);
  if(item){
    res.render("cabinet/admin-edit-profile", item);
  }else{
    const data = {
      texts:`Este usuarío com id ${_id} está indisponível. Por favor tente mais tarde`,
      redirectTo:"/admin/users",
      btnTitle:"Voltar atrás"
    }
    const d = objRevised(alertDatas,data);
    res.status(404).render("cabinet/catchs",d);
  }
});

admin.post("/users/edit-profile", urlencodedParser, async(req,res)=>{
  const {_id} = req.query;
  const bodys = await transformDatas(req.body);
  const datas = {
    type: "update",
    redirect:`/admin/users`,
    collection:"users",
    data:bodys
  }
  const results = await Actions.update(_id,datas);
  if(results){
    req.flash(results.type, results.text);
    res.status(200).redirect(results.redirect);
  }
});

const c = [{
  owner:{
    src:"/imgs/avatar.png",
    name:"Antonio",
    email:"f@gmail"
  },
  stars:4,
  _id:3,
  text:"Eu nai",
  makePublic:true,
  date:["09","09",2025,"12:33:33"]
},{
  owner:{
    name:"Antonio",
    email:"f@gmail",
    src:"/imgs/avatar.png",
  },
  stars:1,
  _id:4,
  text:"Eu nai",
  makePublic:true,
  date:["09","09",2025,"12:33:33"]
},{
  owner:{
    name:"Antonio",
    email:"f@gmail",
    src:"/imgs/avatar.png",
  },
  stars:3,
  _id:7,
  text:"Eu nai",
  makePublic:true,
  date:["09","09",2025,"12:33:33"]
}];
admin.get("/reviews", urlencodedParser, async (req,res)=>{
  const link = {path:`/admin/reviews`,queryString: req.query ? `${new URLSearchParams(req.query).toString()}` : ''};
  const body = await transformDatas(req.query);
  let querys = propertysLength(body) > 0 ? body : null;

  const results = await Actions.get("reviews", querys);
  if(c){
    for(let k in c){
      c[k] = await transformDatas(c[k],true);
    }
    const datas= (pagination(c,!body.page?0:body.page, link, false));
    res.render("cabinet/reviews",{ datas:datas});
  }else{
    res.render("cabinet/reviews",{ datas:null});
  }
});

admin.get("/transactions/:type/view",  urlencodedParser, async (req,res)=>{
  const {type} = req.params;
  const {_id} = req.query;
  let datas = await Actions.get(type,_id,["fleet","gateway","owner"]);
  if(datas){
    const isDeposit = type === "deposits" && datas.status === "Emprogresso" && datas.expireAt.secondsLength >= 0;
    const nesterDatas ={
      isAdmin: true,
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

admin.post("/transaction/:type/action", urlencodedParser, async(req,res)=>{
  const type = req.params.type;
  const {_id} = req.query;
  const bodys = await transformDatas(req.body);
  const datas = {
    type: "update",
    redirect: _id ? `/admin/transactions/${type}/view?_id=${_id}` : `/admin/transactions/${type}`,
    collection:"users",
    data:bodys
  }
  switch(bodys.status){
    case "Emprogresso":
      if(type === "deposits"){
        let results = await confirmDeposit(bodys);
        console.log(results)
      }
    break;
  }
});


//admin.use('/transactions', transactions)




module.exports = admin;