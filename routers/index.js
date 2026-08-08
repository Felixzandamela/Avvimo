const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const {Actions} = require('../middlewares/action');
const {quote} = require('../middlewares/quotes');
const { transformDatas, objRevised } = require('../middlewares/utils');
const {authentication} = require("../middlewares/authentication");
const {getFleets} = require("../middlewares/getFleets");
const {getReviews} = require("../middlewares/getReviews");
router.get('/', async(req,res)=>{
  const activeYears = (date) => {
    let time = (new Date()).getTime() - date.getTime();
    let year = Math.floor(time / 1000/60/60/24/30/12); //Milliseconds/seconds/minutes/hours/days/months/yeas
    return year;
  } //return years of activitys 
  const yearsOfActivitys = activeYears(new Date("Oct, 12 2023"));
  const datas = await getFleets("cabinet");
  res.render("mains/home",{fleets:datas, yearsOfActivitys:yearsOfActivitys});
});

router.get("/how-it-works",(req,res)=>{
  res.render("mains/how-it-works");
});
router.get("/terms-condition",(req,res)=>{
  res.render("mains/terms");
});
router.get("/privacy-policy",(req,res)=>{
  res.render("mains/privacy-policy");
});

router.get("/reviews", async (req,res)=>{
  const link = {path:`/reviews`,queryString: req.query ? `${new URLSearchParams(req.query).toString()}` : ''};
  const body = await transformDatas(req.query);
  const results = await getReviews("public", body, link);
  
  res.render("mains/reviews", {datas:results});
});
router.get("/new-review", authentication, async (req, res)=>{
  let review = await Actions.get("reviews",{owner:req.user._id},null,true);
  res.render("mains/new-review", {review:review});
});

router.post("/new-review", authentication, urlencodedParser, async (req, res)=>{
  const bodys = await transformDatas(req.body);
  console.log(bodys)
  const datas = {
    type: bodys._id? "update" : "set",
    redirect:`/reviews`,
    collection: "reviews",
    data: bodys
  }
  let results;
  switch(datas.type){
    case "update":
      results = await Actions.update(bodys._id, datas);
    break;
    case "set": 
      results = await Actions.set(datas);
    break;
    default:
    req.flash("error", "Houve um erro!");
    res.redirect("/reviews");
  }
  if(results){
    console.log(results)
    req.flash(results.type, results.texts);
    res.redirect(results.redirect);
  }
});


router.get('/ref', urlencodedParser, async (req, res)=>{
  const link = `/auth/sign-up`;
  const {upline} = req.query;
  if(upline){
    const item = await Actions.get("users",upline);
    if(item){
      res.status(200).render("auth/register",{upline:upline, quote:quote()});
    }else{
      req.flash("error", "Este usuarío está indisponível");
      res.redirect(302, link);
    }
  }else{
    res.redirect(302, link);
  }
});

router.get("/me", urlencodedParser, async (req, res) => {
  const { _id } = req.query;
  if (!_id) {
    return res.status(400).json({ error: 'ID é obrigatório' });
  }
  try {
    const results = await Actions.get("users", _id);
    if (!results) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const datas = {
      name: results.name,
      src: results.src,
      isAdmin: results.isAdmin
    }
    res.status(200).json(datas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

router.get("/contact-us", (req,res)=>{
  const _id = req.user ? req.user._id : "";
  res.render("cabinet/chat", {id:_id,mode:"cabinet"});
});

router.use((req, res) => {
  res.status(404).render('mains/404-page');
})

module.exports = router;