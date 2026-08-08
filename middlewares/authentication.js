const storage = require('node-sessionstorage');
const {sendEmail} = require('./sendEmail');
function getText (req){
  const datas ={
    type:"error",
    title:"Verifica a sua conta",
    texts:`Verica a sua conta ${req.user.name}, não recebeu o email de verificação no seu inbox?`,
    btnTitle:"Reenvir novamente",
    redirectTo:`/auth/send-verification?id=${req.user._id}`
  }
  return datas;
}
const getCeo = function(req){
  return {
    email: process.env.CEO,
    name: process.env.COMPANY,
    guest: req.user,
    path: req.originalUrl
  }
}

const accessDeniedDatas = function(req){
  return {
    type: "error",
    title: "Acesso negado",
    texts: `Você não tem acesso pra efetuar essa operação ${req.user.name}, se você achar que isso foi um erro contacte o ceo.`,
    btnTitle: "Voltar atrás",
    redirectTo: null
  }
}

// link to only ceo can navigate
const forCeoOnlyRegex = [
  /^\/admin\/transaction\/([^\/]+)\/action/i,
  /^\/admin\/users\/delete\/([^\/]+)/i,
  /^\/admin\/users\/a-edit-profile/i,
  /^\/admin\/(gateways|fleets)\/action/i
];
const checkLink = function(req){
  let result = false;
  for(let i of forCeoOnlyRegex){
    if(i.test(req.originalUrl)){
      result = true;
      break;
    }
  }
  return result;
}

module.exports = {
  authentication: function(req, res, next) {
    if(!req.isAuthenticated() || !req.user) {
      const redirectTo = req.originalUrl;
      storage.setItem("redirectTo", redirectTo);
      res.status(403).redirect('/auth/login');
    }else if(!req.user.verified){
      res.status(401).render('mains/cards-th', getText(req));
    }else if(req.user.bruteForce.active){
      storage.setItem("_id", req.user._id.toString());
      storage.setItem("sendcode","true");
      res.redirect("/auth/request-verify-code");
    }else{return next();}
  },
  authAdmin: async function (req, res, next) {
    if(!req.isAuthenticated() || !req.user) {
      storage.setItem("redirectTo", req.originalUrl);
      res.redirect('/auth/login');
    }else if(!req.user.verified){
      res.render('mains/cards-th', getText(req));
    }else if(req.user.bruteForce.active){
      storage.setItem("_id", req.user._id.toString());
      storage.setItem("sendcode","true");
      res.redirect("/auth/request-verify-code");
    }else if(!req.user.isAdmin){
      const send = await sendEmail(getCeo(req), "unauthorizedNavigator");
      res.render('mains/cards-th', accessDeniedDatas(req));
    }else if(req.user.email !== getCeo(req).email && checkLink(req)){
      const send = await sendEmail(getCeo(req), "unauthorizedAdmin");
      res.render('cabinet/catchs', accessDeniedDatas(req));
    }else{return next();}
  }
}