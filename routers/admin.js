const express = require("express");
const admin = express.Router();
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({limit: '50mb', extended: true });
const {sendEmail} = require('../middlewares/sendEmail');
const {asideLinks,getTime,transformDatas,sortByDays, objRevised, statusIcons, propertysLength,msgsStatus, formatDate,cardDatas} = require('../middlewares/utils');
const {pagination} = require('../middlewares/pagination');
const {Actions,db} = require('../middlewares/action');
const {getFleets} = require("../middlewares/getFleets");
const {getReviews} = require("../middlewares/getReviews");
const {DepositsActions,CommissionsActions,WithdrawalsActions,getTransactions,getTransaction} = require("../middlewares/transactions-actions");
const {performance} = require("../middlewares/performances");
const {getUsersToEmail} = require("../middlewares/getUsersToEmail");
const {emailQueueSender} = require("../middlewares/emailQueueSender");

const alertDatas = {
  type:"error",
  title:"Erro!",
  texts: "Houve um erro, por favor tente mais tarde. Se o erro persistir, por favor contacte-nos atrás dos nossos canaís.",
  btnTitle: "Voltar atrás",
  redirectTo: null
}

const transTypes = {
  deposits:"Deposítos",
  withdrawals:"Saques",
  commissions:"Comiss"
}

const textConfig = {
  fields: {gateways: "metódo de pagamento",fleets: "frota"},
  actions: {set: "Nova",update: "Atualizar"},
  viewPrefix: "cabinet/action-"
};

const getFieldOptions = function(field, action, textConfig) {
  if (!textConfig.fields[field] || !textConfig.actions[action]) {
    console.warn("missing title fields");
    return "";
  }
  return {
    text: `${textConfig.actions[action]} ${textConfig.fields[field]}`,
    view: `${textConfig.viewPrefix}${field}`
  }
}

admin.get('/', (req, res) => {res.redirect("/admin/dashboard");});
admin.get('/dashboard', async (req, res) => {
  const arryFields = ["deposits", "withdrawals", "commissions", "payouts", "users"];
  const renderCards = await performance(arryFields);
  res.status(200).render("cabinet/ad-dashboard", renderCards);
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
  
  if(type === "update"){
    let item = await Actions.get(collection,_id);
    if(item){itemToUpdate = item;}
  }
  const d = getFieldOptions(collection, type, textConfig);
  const datas = {
    admin:true,
    text:d.text,
    type:type,
    _id: _id,
    view: d.view,
    item: itemToUpdate
  }
  if(type == "update" && !datas.item){
    const data = {
      texts:`Este ${collection} com id ${_id} está indisponível. Por favor tente mais tarde`,
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
  let extractedQuery = {};
  for(let key in req.query){
    if(key !== "page"){
      if(req.query[key] !== "" || req.query[key]  !== undefined){
        extractedQuery[key] = req.query[key].trim();
      }
    }
  }
  const page = req.query.page ? parseInt(req.query.page) : 0;
  const querys = await transformDatas(extractedQuery);
  let results = await Actions.get("users", querys);
  if(results){
    for(let k in results){results[k] = await transformDatas(results[k]._doc,true);}
    results.sort(sortByDays);
    const datas= (pagination(results, page, link, false));
    res.render("cabinet/users", {datas:datas});
  }else{
    res.render("cabinet/users", {datas:null});
  }
});
admin.get("/users/delete/:_id", urlencodedParser, async (req,res)=>{
  const {_id} = req.params;
  const datas = {
    type: "delete",
    redirect:`/admin/users`,
    collection:"users",
  }
  const results = await Actions.delete(_id, datas);
  if(results){
    req.flash(results.type, results.text);
    res.status(200).redirect(results.redirect);
  }
});
admin.get("/users/:action", urlencodedParser, async(req,res)=>{
  const {_id} = req.query;
  const action = req.params.action;
  let results = await Actions.get("users",_id);
  if(results){
    let item = action === "profile-view"? await transformDatas(results._doc,true) : results;
    res.render(`cabinet/${action}`, {item:item});
  }else{
    const data = {
      texts:`Este usuarío com id ${_id} está indisponível. Por favor tente mais tarde`,
      redirectTo:"/admin/users",
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

admin.get("/reviews", urlencodedParser, async (req,res)=>{
  const link = {path:`/admin/reviews`,queryString: req.query ? `${new URLSearchParams(req.query).toString()}` : ''};
  const body = await transformDatas(req.query);
  const results = await getReviews("admin", body, link);
  res.render("cabinet/reviews",{ datas: results});
});

admin.post("/reviews/update", urlencodedParser, async(req,res)=>{
  const bodys = await transformDatas(req.body);
  const datas = {
    type: "updateMany",
    redirect:`/admin/reviews`,
    collection:"reviews",
    data:{
      makePublic: bodys.makePublic
    }
  }
  const results = await Actions.updateMany(bodys.ids, datas);
  req.flash(results.type, results.text);
  res.redirect(results.redirect);
});

admin.get("/transactions", (req,res)=>{
  res.redirect(301, "/admin/transactions/deposits");
});
admin.get("/transactions/:type", urlencodedParser, async (req,res)=>{
  const type = req.params.type;
  const link = {path:`/admin/transactions/${type}`,queryString: req.query ? `${new URLSearchParams(req.query).toString()}` : ''};
  const body = await transformDatas(req.query);
  const result = await getTransactions("admin",body,type);
  let datas = !result.successed ? objRevised(alertDatas, result) : result;
  res.render( !datas.successed ? "cabinet/catchs" : "cabinet/transactions",datas);
});


admin.get("/transactions/:type/view",  urlencodedParser, async (req,res)=>{
  const {type} = req.params;
  const {_id} = req.query;
  let datas = await getTransaction("admin", type, _id);
  res.render(!datas.successed ? "cabinet/catchs" : "cabinet/transactionCard", datas);
});

admin.post("/transaction/:type/action", urlencodedParser, async(req,res)=>{
  const type = req.params.type;
  const {_id} = req.query;
  const bodys = await transformDatas(req.body);
  const datas = {
    type: "update",
    redirect: _id ? `/admin/transactions/${type}/view?_id=${_id}` : `/admin/transactions/${type}`,
    collection:type,
    data:bodys
  }
  const transactionsTypeMap ={
    deposits: await DepositsActions(bodys),
    commissions: await CommissionsActions(bodys),
    withdrawals: await WithdrawalsActions(bodys)
  }
  if(/^(deposits|commissions|withdrawals)$/i.test(type)){
    const result = transactionsTypeMap[type];
    if(typeof result === "string"){
      req.flash("error", result);
    }
      res.redirect(datas.redirect);
  }else{
    const newAlertDatas = objRevised(alertDatas,{texts: "Esse tipo de transacões não existe."});
    res.render("cabinet/catchs", newAlertDatas);
  }
});

admin.get("/support", (req,res)=>{
  const user = req.user;
  //const url = concatURl("support", `/?id=${user._id}&redirectedFrom=${req.headers.host}`);
 res.render("cabinet/chat", {id:user._id, mode:"admin"});
});

admin.get("/e-mails", (req,res)=>{
  res.redirect(301, "/admin/e-mails/send");
})

admin.get("/e-mails/send", async (req,res)=>{
  const emailsQueue = await Actions.get("emailsQueue");
  res.render("cabinet/e-mails",{emailsQueue: emailsQueue});
});

admin.post("/e-mails/send-new", urlencodedParser, async (req, res) => {
  const { name, value, subject, emailText } = req.body;
  const regexQuery = /^(all|notMadeDeposit|madeDeposit)$/i;
  const query = name && regexQuery.test(name) ? value : name === "email" ? { email: { $in: value.split(",") } } : { [name]: value };
  let users = await getUsersToEmail(query);
  const _ids = [];
  if(users){
    for (let k = 0; k < users.length; k++) {
      _ids.push(users[k]._id.toString());
    }
    const datas = {
      type: "set",
      redirect: "/admin/e-mails/send",
      collection: "emailsQueue",
      data:{
        _ids: _ids,
        subject: subject,
        text: emailText
      }
    };
    const results = await Actions.set(datas);
    req.flash(results.type, results.text);
    res.redirect(results.redirect);
  }else{
    req.flash("error", "Usuaríos não encontrados");
    res.redirect("/admin/e-mails/send");
  }
});

admin.get("/emails/action", urlencodedParser, async (req, res) => {
  const {type, _id} = req.query;
  let results;
  switch(type){
    case "send-now":
      const sendResults = await emailQueueSender(_id);
      results = {
        type: "success" ,
        text: sendResults,
        redirect: "/admin/e-mails/send"
      }
    break;
    case "delete":
      const datas ={
        collection: "emailsQueue",
        redirectTo: "/admin/e-mails/send"
      };
      results = await Actions.delete(_id, datas);
    break;
    default:
      res.render("cabinet/catchs", alertDatas);
    break;
  }
  if(results){
    req.flash(results.type, results.text);
    res.redirect(results.redirect);
  }
});
  
const cron = require('node-cron');
cron.schedule('* * * * *', async () => {
  console.log(7)
 // emailQueueSender();
});
/*
cron.schedule('* * * * *', async () => {
  const depositsToUpdate = await Actions.get("deposits", {status:{ $in: ["EmProgresso", "Pendente"]}});
  const prop = function(result,_id,status){
    if(result){console.log( `deposits: ${_id} ${status}`);}
  }
  if(depositsToUpdate){
    for(let d in depositsToUpdate){
      const {_id,expireAt, date, amount, status} = depositsToUpdate[d];
      const bodys = {
        _id: ""+_id,
        status: status,
        amount: amount
      };
      let result
      if(formatDate(expireAt).secondsLength >= 1 && status === "EmProgresso"){
        bodys.status = "Concluido";
        result = await DepositsActions(bodys);
      }
      if(formatDate(date).daysLength >= 2 && status === "Pendente"){
        bodys.status = "Rejeitado";
        result = await DepositsActions(bodys);
      }
      if(result){
        prop(result,_id,bodys.status);
        continue;
      }else{continue;}
    }
  }
});

cron.schedule('* * * * *', async function(){
  const usersTodelete = await Actions.get("users",{inDeleteQueue:true});
  if(usersTodelete){
    for(let b in usersTodelete){
      const {_id, name} = usersTodelete[b];
      const {date} = usersTodelete[b].inDeleteQueue;
      if(formatDate(date).secondsLength >= 1){
        const datas = {
          type: "delete",
          redirect:`/admin/users`,
          collection:"users",
        }
        const results = await Actions.delete(_id, datas, true);
        console.log(name, "Deleted successfull");
        if(results) continue;
      }
    }
  }
});


cron.schedule('0 8 * * 2', async () => {
  if(process.env.ENV_TYPE === "production"){
    const usersUnverified =  await getUsers({verified: false});
    if(usersUnverified && Array.isArray(usersUnverified)){
      for(let k = 0; k < usersUnverified.length; k++){
        const user = usersUnverified[k];
        if(!user.verified){
          const send = await sendEmail(user, "verificarionAlert");
        }
      }
    }
    const usersNotMadeDeposit = await getUsersToEmail({isAdmin:true});
    for (let user of usersNotMadeDeposit){
      if(user.deposits){
        if(user.deposits.length > 0){
          const send = await sendEmail(user, "warningBan");
        }else{
          const send = await sendEmail(user, "depositNewsletter");
        }
      }
    }
  }
});
*/
module.exports = admin;