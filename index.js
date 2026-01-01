const express = require('express');
const mongoose = require('mongoose');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');
const {engine}= require('express-handlebars');
//*const useragent = require('express-useragent');
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
const _host = process.env.HOST;
const company = process.env.COMPANY;
const {authentication} = require("./middlewares/authentication");

const {asideLinks,transformDatas,_defineProperty} = require("./middlewares/utils");
const {getFleets} = require("./middlewares/getFleets");

const DATABASE = process.env.DATABASE;
mongoose.Promise = global.Promise;
mongoose.connect(DATABASE).then(async() => {
  console.log("DB conectado com sucesso!");
   const db = mongoose.connection.db; // scale para KB, MB, etc.
  const stats = await db.command({ dbStats: 1, scale: 1024 * 1024 }); // escala para MB
  let total = parseFloat(process.env.STORAGESIZE), used = stats.storageSize < 5? 20 : stats.storageSize;
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
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.baseUrl = `${req.protocol}://${_host}`;
  res.locals.company = company;
  res.locals.user = req.user? await transformDatas(_defineProperty(req.user._doc),true) : null;
  res.locals.storage = storage.getItem("dbStorage");
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

const body = {
  _id:"6947f2f526d71b0f52f58de4",
  page:0,
  
}
const {DepositsActions,getTransaction} = require("./middlewares/transactions-actions");

async function gj (){
  const h = await getFleets("admin","deposits","6947f2f526d71b0f52f58de4")
 
}




app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "blob:", "'unsafe-inline'", "https://unpkg.com","https://cdnjs.cloudflare.com","https://code.highcharts.com"],
      styleSrc: ["'self'", "'unsafe-inline'","https://cdn.jsdelivr.net","https://googleapis.com","https://unpkg.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net","https://googleapis.com","https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'","data:", "'unsafe-inline'", "'https://example.com'"],
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
app.listen(port, () => {
  //https.createServer(options, app);
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