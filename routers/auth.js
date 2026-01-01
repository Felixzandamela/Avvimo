const express = require("express");
const storage = require('node-sessionstorage');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const auth =  express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const passport = require('passport');

const {quote} = require('../middlewares/quotes');
const {transformDatas,objRevised,formatDate,getTime} = require('../middlewares/utils');
const {Actions} = require('../middlewares/action');
const {sendEmail} = require('../middlewares/sendEmail');
const {expireDay} = require('../middlewares/expireDays');

const alertDatas = {
  type:"error",
  title:"Erro!",
  texts: "Houve um erro, por favor tente mais tarde. Se o erro persistir, por favor contacte-nos atrás dos nossos canaís.",
  btnTitle: "Pagína inicíal",
  redirectTo: "/auth/"
}
auth.get("/",(req,res)=>{
  res.status(200).redirect("/auth/login");
});

auth.get('/login', (req, res)=>{
  res.status(200).render("auth/login",{quote:quote()});
});
auth.get('/sign-up', (req, res)=>{
  res.status(200).render("auth/register",{quote:quote()});
});

auth.get('/ref', urlencodedParser, async (req, res)=>{
  const {upline} = req.query;
  if(upline){
    const item = await Actions.get("users",upline);
    if(item){
      res.status(200).render("auth/register",{upline:upline, quote:quote()});
    }else{
      req.flash("error", "Este usuarío está indisponível");
      res.status(404).redirect("/auth/sign-up");
    }
  }else{
    res.status(404).redirect("/auth/sign-up");
  }
});

auth.get('/request-reset-password', urlencodedParser, (req, res)=>{
  const {email} = req.query;
  res.status(200).render("auth/forgot-password",{quote:quote(),email:email});
});



auth.post('/sign-up', urlencodedParser, async (req,res) =>{
  const bodys = await transformDatas(req.body);
  const datas = {
    type:"set",
    redirect:`/auth/`,
    collection: "users",
    data: bodys
  }

  const result = await Actions.set(datas, {email: bodys.email});
  const data = objRevised(alertDatas, {texts:result.type == "error"? result.text : alertDatas.texts});
  if(result.type == "error"){
    res.status(200).render("mains/cards-th",data);
  }else{
    const item = await Actions.get("users",{email:bodys.email},null,true);
    if(item){
      res.status(200).redirect(`/auth/send-verification?id=${item._id}`);
    }else{res.status(200).render("mains/cards-th",data);}
  }
});

auth.get("/send-verification", urlencodedParser, async (req, res) => {
  const id = req.query.id;
  const owner = await Actions.get("users",id);
  const datas ={
    type:"error",
    title:owner? "Verifica a sua conta" : "Houve um erro",
    texts:owner? "Um e-mail de verificação da conta foi enviado no seu inbox. Por favor verifique a sua conta." : "Este usuario está indisponível.\nPor favor tente mais tarde!",
    btnTitle: owner? "Reenvir novamente": "Ir para pagína inicíal",
    redirectTo:owner? `/auth/send-verification?id=${id}` : "/auth/"
  }
  if(owner){
    const send = await sendEmail(owner,"verifyaccount");
    res.status(200).render('mains/cards-th', datas);
  }else{
    res.status(200).render('mains/cards-th', datas);
  }
});

auth.get("/account-verification", urlencodedParser, async (req,res)=>{
  const {id} = req.query;
  const account = await Actions.get("users", id);
  if(account ){
    if(account.verified){
      const d ={
        type:"error",
        title: "Conta verificado",
        texts: "Esta conta já foi verificado",
        btnTitle: "Painel",
        redirectTo: `/cabinet/dashboard`
      }
      const data = objRevised(alertDatas,d);
      res.status(404).render("mains/cards-th",data);
    }else{
      account.verified = true;
      account.save().then(()=>{
        const d ={
          title: "Verificado!",
          type: "success",
          texts:"Conta verificado com sucesso!",
          redirectTo: `/cabinet/dashboard`
        }
        const data = objRevised(alertDatas,d);
        res.status(200).render("mains/cards-th",data);
      }).catch((error)=>{
        res.status(404).render("mains/cards-th",alertDatas);
      });
    }
  }else{
    const data = objRevised(alertDatas,{texts: "Este usuario está indisponível.\nPor favor tente mais tarde!"});
    res.status(404).render("mains/cards-th",data);
  }
});

auth.post("/request-reset-password", urlencodedParser, async (req,res)=>{
  const email = req.body.email;
  const account = await Actions.get("users",{email:email});
  if(account){
    account.requestchangesdate = getTime().fullDate;
    try{
      const save = await account.save();
      const d ={
        type:"success",
        title:"Pedido submetido",
        texts:"O seu pedido de redifinição da conta foi submetido. Um email de redifinição da conta foi enviado no seu inbox."
      }
      const send = await sendEmail(account,"resetpassword");
      const msg = objRevised(alertDatas,d);
      res.status(200).render("mains/cards-th", msg);
    }catch(error){
      console.log(error);
      const data = objRevised(alertDatas,{redirectTo:"/auth/request-reset-password"});
      res.status(404).render("mains/cards-th",data);
    };
  }else{
    const data = objRevised(alertDatas,{redirectTo:"/auth/request-reset-password"});
    res.status(404).render("mains/cards-th",data);
  }
});

auth.get("/reset-password", urlencodedParser, async (req,res)=>{
  const {token} = req.query;
  const account = await Actions.get("users",token);
  if(account){
    if(formatDate(account.requestchangesdate).minutesLength > 15){
      const d = {
        texts:"Este pedido foi cancelado. O tempo estimado para mudar a senha é de 15 minutos após o pedido.",
        btnTitle:"Tentar novamente",
        redirectTo:"/auth/request-reset-password"
      }
      const data = objRevised(alertDatas,d);
      res.status(404).render("mains/cards-th",data);
    }else{
      res.status(200).render("auth/reset-password",{id:token,quote:quote()});
    }
  }
});
auth.post("/new-password", urlencodedParser, async (req,res)=>{
  const id = req.query.token;
  const bodys = await transformDatas({newpassword: req.body.newpassword});
  const datas = {
    type:"update",
    redirect: `/cabinet/dashboard`,
    collection: "users",
    data:bodys
  }
  const account = await Actions.get("users",id);
  if(account){
    const result = await Actions.update(id,datas);
    if(result.type == "success"){
      const send = await sendEmail(account, "passwordchanged");
      const d ={
        type:"success",
        title:"Senha redifinido",
        texts:"Senha redifinido com sucesso",
        btnTitle:"Ir para painel",
        redirectTo: result.redirect
      }
      const data = objRevised(alertDatas,d);
      res.status(200).render("mains/cards-th", data);
    }else{
      res.status(200).render("mains/cards-th", alertDatas);
    }
  }
});

auth.post("/account_action", urlencodedParser, async(req,res)=>{
  const bodys = await transformDatas(req.body);
  const {_id,type} = bodys;
  const datas = {
    type:"update",
    redirect: `/cabinet/dashboard`,
    collection: "users",
    data:{
      cronTodelete: type? expireDay(30) : []
    }
  }
  
  const account = await Actions.get("users",_id);
  if(account){
    const results = await Actions.update(_id,datas);
    if(results){
      if(type){
        const send = await sendEmail(account, "requestdeleteaccount");
         req.flash(results.type, results.text);
         res.redirect(302,results.redirect);
      }else{
        req.flash(results.type, results.text);
        res.redirect(302,results.redirect);
      }
    }
  }else{
    req.flash("error", "Este usuarío não está disponível");
    res.redirect(datas.redirect);
  }
});



auth.post('/login', urlencodedParser, (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if(err) { return next(err); }
    if(!user) {
      req.flash('error', info.message);
      return res.redirect('/auth/login');
    }
    req.logIn(user, (err) => {
      if(err) { return next(err); }
      const redirectTo = storage.getItem("redirectTo");
      const go = !redirectTo ? "/cabinet/dashboard" : redirectTo;
      return res.redirect(go);
    });
  })(req, res, next);
});
/*
auth.post('/login', urlencodedParser, (req, res, next)=>{
  passport.authenticate("local", {
    successRedirect:  `${req.protocol}://cabinet.${_host}/dashboard`,
    failureRedirect: "/login",
    failureFlash: true
   })(req, res, next)
})
*/
auth.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
     req.user = null;
    res.redirect(`/auth/login`);
  });
});

module.exports = auth;