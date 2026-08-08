const {Actions} = require("./action");
const bcrypt = require('bcryptjs');
const localStrategy = require("passport-local").Strategy;

module.exports =  function(passport, req, res, next){
  passport.use( new localStrategy( async (username, password, done)=>{
    let user = await  Actions.get("users",{ email: username }, null, true);
    try{
       if(!user){return done(null, false, {message:"Não há usuarío registrado com esse email!"});}
      const same = await bcrypt.compare(password, user.password);
      if(!same){return done(null, false, {message:"Senha incorrecta!"});}
      return done(null, user);
    }catch(error){
      console.log(error);
      return done(null, false, {message:"Houve um erro ao autenticar"});
    }
  }));
  
  passport.serializeUser((user, done)=>{
    done(null, user._id);
  });
  passport.deserializeUser(async(id, done) => {
    let user = await  Actions.get("users",id);
    if(user){done(null, user);
    }else{done(null, false);}
  });
}