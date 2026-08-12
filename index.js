const express = require('express');
const mongoose = require('mongoose');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');
const {engine}= require('express-handlebars');
const storage = require('node-sessionstorage')

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
const {performance} = require("./middlewares/performances");

const _protocal = process.env.PROTOCAL;
const _host = process.env.HOST;
const company = process.env.COMPANY;
const {authentication, authAdmin} = require("./middlewares/authentication");

const {asideLinks,transformDatas,_defineProperty,getScheduleEvent} = require("./middlewares/utils");
const {getFleets} = require("./middlewares/getFleets");

const DATABASE = process.env.DATABASE;
mongoose.Promise = global.Promise;
mongoose.connect(DATABASE).then(async() => {
  console.log("DB conectado com sucesso!");
   const db = mongoose.connection.db; // scale para KB, MB, etc.
  const stats = await db.command({ dbStats: 1, scale: 1024 * 1024 }); // escala para MB
  let total = parseFloat(process.env.STORAGESIZE), used = stats.storageSize < 1 ? 5 : stats.storageSize;
  const dbStorage = {
    total: parseFloat(process.env.STORAGESIZE),
    used: {
      number: used,
      percentage: parseFloat((used / total) * 100).toFixed(2)
    },
    free: {
      number: total - used,
      percentage: parseFloat(((total - used) / total) * 100).toFixed(2),
    },
    showWarning: (((total - used) / total) * 100) < 10 ? true : false
  }
  storage.setItem("dbStorage",dbStorage);
}).catch((erro) => {console.log("Ops ocorreu um erro :" + erro);});

const jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: true })
const handlebarsOptions = {
  handlebars: allowInsecurePrototypeAccess(Handlebars),
  helpers: {
    breakLine: function(texto) {
      return texto.replace(/\n/g, '<br>');
    }
  }
};

app.engine('handlebars', engine(handlebarsOptions));
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static(path.join(__dirname,"public")))

//session
app.use(session({
  secret: "bolecadas",
  resave: true,
  saveUninitialized: true,
  rolling: true,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 // 24 horas
  }
}));

app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//middlewares
app.use(async(req, res, next)=>{
  const arryFields = ["users"];
  const affiliatesCard =  req.user? await performance(arryFields, req.user._id) : null;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.baseUrl = `${_protocal}${_host}`;
  res.locals.company = company;
  res.locals.gateways = await Actions.get("gateways", {status: true});
  res.locals.user = req.user? await transformDatas(_defineProperty(req.user._doc),true) : null;
  res.locals.affiliates = affiliatesCard ? affiliatesCard.cards[0] : null;
  res.locals.events = getScheduleEvent();
  res.locals.storage = storage.getItem("dbStorage");
  next();
});

/*
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "blob:", "'unsafe-inline'","https://cdnjs.cloudflare.com","https://code.highcharts.com"],
      styleSrc: ["'self'","'unsafe-inline'","https://cdn.jsdelivr.net","https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'","data:","https://cdn.jsdelivr.net","https://fonts.googleapis.com", "https://fonts.gstatic.com" ,"https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'","data:", "blob:", "'unsafe-inline'"],
      connectSrc: ["'self'","https://ipinfo.io"],
      frameSrc: ["'self'"],
      objectSrc: ["'self'"]
    }
  })
);
*/
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.use('/admin', (req, res, next) => {
  const isAdmin = true;
  res.locals.asideLinks = asideLinks("admin");
  res.locals.mode = "admin";
  res.locals.isAdmin = isAdmin;
  next();
});

app.use('/cabinet', authentication, (req, res, next) => {
  const isAdmin = false;
  res.locals.asideLinks = asideLinks("cabinet");
  res.locals.mode = "cabinet";
  res.locals.isAdmin = isAdmin;
  next();
});

app.use("/cabinet", cabinet);
app.use("/admin", admin);
app.use("/auth",auth); /*vhost("auth.localhost",*/ 
app.use(index);

/*
const options = { 
  key: fs.readFileSync("server.key"), 
  cert: fs.readFileSync("server.cert"), 
}; 
*/
const port = process.env.Port || 8089;
/*
https.createServer(options, app).listen(port, () => {
  const ip = getIPAddress();
  console.log(`listening at ${ip}`);
});
*/

app.listen(port, () => {console.log(`listening at localhost`);});