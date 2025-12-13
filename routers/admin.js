const express = require("express");
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');
const {engine}= require('express-handlebars');
const path = require('path');
const admin = express();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const {asideLinks,transformDatas,sortByDays, objRevised, statusIcons, propertysLength,msgsStatus, formatDate} = require('../middlewares/utils');
const {pagination} = require('../middlewares/pagination');
const {Actions} = require('../middlewares/action');
const transactions = require('./transactions');
const protoAccess = {handlebars: allowInsecurePrototypeAccess(Handlebars)};
admin.engine('handlebars', engine(protoAccess));
admin.set('view engine', 'handlebars');
admin.set('views', './views');
admin.use(express.static(path.join(__dirname,"public")));

admin.use((req, res, next)=>{
  res.locals.isAdmin = true;
  res.locals.asideLinks = asideLinks("admin");
  next();
});

const alertDatas = {
  type:"error",
  title:"Erro!",
  texts: "Houve um erro, por favor tente mais tarde. Se o erro persistir, por favor contacte-nos atrás dos nossos canaís.",
  btnTitle: "Painel",
  redirectTo: "/dashboard"
}

const transTypes = {
  deposits:"Deposíto",
  withdrawals:"Saques",
  commissions:"Comissão"
}

admin.get('/', (req, res) => {
  res.redirect("/dashboard");
});
admin.get('/dashboard', (req, res) => {
  res.status(200).render("cabinet/dashboard");
});

admin.get('/fleets', urlencodedParser, async (req, res) => {
    const datas = await Actions.get("fleets");
    res.status(200).render("cabinet/fleets",{admin:true, fleets:datas});
});

admin.get("/gateways", async (req,res)=>{
  const datas = await Actions.get("gateways");
  res.status(200).render("cabinet/gateways", {gateways:datas});
});

admin.get('/:collection/action', urlencodedParser, async (req, res) => {
  const type = !req.query.type ? "set" : req.query.type;
  const id = !req.query.id ? "" : req.query.id;
  const collection = req.params.collection;
  let itemToUpdate;
  if(type == "update"){
    let item = await Actions.get(collection,id);
    if(typeof item == "object"){
      itemToUpdate = item
    }
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
    id: id,
    view: d.view[collection],
    item: itemToUpdate
  }
  if(type == "update" && !datas.item){
    const data = {
      texts:`Este ${collection} com id ${id} está indisponível. Por favor tente mais tarde`,
      btnTitle: "Voltar atrás",
      redirectTo: `/${collection}`
    }
    const d = objRevised(alertDatas,data);
    res.status(404).render("cabinet/catchs",d);
  }else{
    res.status(200).render(datas.view,datas);
  }
});


admin.post('/:collection/action', urlencodedParser,async (req, res) => {
  const {type,id} = req.query;
  const collection = req.params.collection;
  const bodys = await transformDatas(req.body);
  const datas = {
    type:type,
    redirect:`/${collection}`,
    collection:collection,
    data:bodys
  }
  var results;
  if(!Actions[type]){
    req.flash("error", "Acão indisponível");
    res.status(404).redirect(`/${collection}`);
  }else{
    switch(type){
      case "set":
        results = await Actions.set(datas,{name:bodys.name});
        break;
      default:
        results = await Actions[type](id,datas);
      break;
    }
  }
  if(results){
    console.log(results)
    req.flash(results.type, results.text);
    res.redirect(results.redirect);
  }
});



admin.get("/users", urlencodedParser, async(req,res)=>{
  const link = {path:`/users`,queryString: req.query ? `${new URLSearchParams(req.query).toString()}` : ''};
  const body = await transformDatas(req.query);
  let querys = propertysLength(body) > 0 ? body : null;
  let results = await Actions.get("users", querys);
  let a = [{
  _id:"btry44",
      name:"Antonio",
      email:"wf@gmail",
  isAdmin:false,
  isBanned:false,
  upline:"5y",
  balance:200,
  date:["09",10,2025,"12:33:33"]
},{
  _id:"56765dsw7",
  name:"Antonio",
  email:"a@gmail",
  balance:100,
  isAdmin:true,
  upline:"fff",
  isBanned:false,
  date:["09",10,2025,"12:33:33"]
},{
  name:"Antonio",
  email:"f@gmail",
  _id:"4dr5ub4",
  balance:209,
  isAdmin:false,
  upline:"",
  isBanned:true,
  date:["09","09",2025,"12:33:33"]
}];
  if(a){
    for(let k in a){
      a[k] = await transformDatas(a[k],true);
    }
    console.log(a)
    a.sort(sortByDays);
    const datas= (pagination(a,!body.page?0:body.page, link, false));
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
      redirectTo:"/users",
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
    redirect:`/users`,
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
  const link = {path:`/reviews`,queryString: req.query ? `${new URLSearchParams(req.query).toString()}` : ''};
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



admin.use('/transactions', transactions)




module.exports = admin;