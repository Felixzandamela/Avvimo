const {Actions} = require("./action");
const bcrypt = require('bcryptjs');
const localStrategy = require("passport-local").Strategy;

module.exports =  function(passport, req, res, next){
  /*const user = {
        _id:"2edzddy5rt34ygfhhi53escgegryghtrghghrc",
          name:"albino",
          src:"/imgs/avatar.png",
          isAdmin:false,
          balance:390900.45,
          isBanned:false,
          phoneNumber:"",
          location:"",
          agent:"",
          online:true,
          verified:true,
          upline:"",
          date:[10,11,2025,"19:45:23"],
          requestchangesdate:"",
          cronTodelete:"",
          email:"felixjuliaozandamela@gmail.com",
          password:'$2b$15$d652.BPz6EqMH0fR0B0DT.1qBre51FPNaHEvv3w0MBSFMEymEuAR6'
        }
 */
  passport.use( new localStrategy( async (username, password, done)=>{
    try{
      let [user] = await  Actions.get("users",{ email: username });
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
    if(user){
      done(null, user);
    }else{
      done(null, false);
    }
  });
}