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

module.exports = {
  authUser: function(req, res, next) {
  if(!req.isAuthenticated() || !req.user) {
    res.status(403).redirect('/auth/login');   
  }else if(!req.user.verified){
    res.status(401).render('mains/cards-th', getText(req));
  }else{
    return next();  
  }
},
  authAdmin: async function (req, res, next) {
  console.log(req.isAuthenticated)
  if(!req.isAuthenticated() || !req.user) {
    res.status(403).redirect('/auth/login');   
  }else if(!req.user.verified){
    res.status(401).render('mains/cards-th', getText(req));
  }else if(!req.user.isAdmin){
    const t = {
      email: process.env.CEO,
      name: process.env.COMPANY,
      owner: req.user
    } 
    const send = await sendEmail(t, "unauthorizedNavigator");
    res.redirect("/error");
  }else{
    return next();  
  }
}
}