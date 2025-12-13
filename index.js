const express = require('express');
const mongoose = require('mongoose');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');
const {engine}= require('express-handlebars');
//*const useragent = require('express-useragent');
const session = require('express-session');
const passport = require('passport')
require("./middlewares/passport-config")(passport);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const path = require('path');
const fs = require("fs");
const https = require("https"); 
const helmet = require("helmet");
const os = require('os');
const vhost = require('vhost');
const app = express();
require('dotenv').config();
const cabinet = require('./routers/cabinet');
const auth = require('./routers/auth');
const index = require('./routers/index');
const admin = require('./routers/admin');
const {Actions} = require('./middlewares/action');
const _host = process.env.HOST;
const company = process.env.COMPANY;

const {asideLinks,transformDatas} = require("./middlewares/utils");
const DATABASE = process.env.DATABASE;
mongoose.Promise = global.Promise;
mongoose.connect(DATABASE).then(() => {
  console.log("DB conectado com sucesso!");

  mongoose.connection.db.stats((err, stats) => {
    if (err) {
      console.log(err);
    } else {
      
      console.log(stats)
      console.log(`Tamanho do banco de dados: ${stats.dataSize} bytes`);
      console.log(`Tamanho do armazenamento do banco de dados: ${stats.storageSize} bytes`);
    }
  });
}).catch((erro) => {
  console.log("Ops ocorreu um erro :" + erro);
});
const jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: true })
const protoAccess = {handlebars: allowInsecurePrototypeAccess(Handlebars)};

app.engine('handlebars', engine(protoAccess));
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static(path.join(__dirname,"public")))

//session
app.use(session({
  secret: "bolecadas",
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,  // só https
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

//*app.use(useragent.express());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


//middlewares
app.use(async(req, res, next)=>{
  const isAdmin = req.user && req.user.isAdmin;
  const mode = isAdmin ? "admin" : "cabinet";
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.baseUrl = `${req.protocol}://${_host}`;
  res.locals.authBaseUrl = `${req.protocol}://auth.${_host}`;
  res.locals.cabinetBaseUrl = `${req.protocol}://cabinet.${_host}`;
  res.locals.company = company;
  res.locals.user = req.user ? await transformDatas(req.user,true) : null;
  res.locals.asideLinks = asideLinks(mode);
  res.locals.mode = mode;
  res.locals.isAdmin = isAdmin;
  console.log(req.user)
  next();
});

/*

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com","https://cdnjs.cloudflare.com","https://code.highcharts.com"],
      styleSrc: ["'self'", "'unsafe-inline'","https://cdn.jsdelivr.net","https://googleapis.com","https://unpkg.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net","https://googleapis.com","https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "'unsafe-inline'", "'https://example.com'"],
      connectSrc: ["'self'", "https://code.highcharts.com"],
      frameSrc: ["'self'", "https://code.highcharts.com"],
      objectSrc: ["'self'", "https://code.highcharts.com"]                
    },
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://example.com");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});
*/

app.use("/cabinet", cabinet);
app.use("/admin", admin);
app.use("/auth",auth); /*vhost("auth.localhost",*/ 
app.use(index);

const options = { 
  key: fs.readFileSync("server.key"), 
  cert: fs.readFileSync("server.cert"), 
}; 

const port = process.env.Port || 8089;
app.listen(port, () => {
  https.createServer(options, app);
  const ip = getIPAddress();
  console.log(`listening at ${ip}`);
});

function getIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return `http://${alias.address}:${port}`;
      }
    }
  }
  return `http://localhost:${port}`;
}