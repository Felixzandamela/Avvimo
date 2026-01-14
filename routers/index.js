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

router.get('/', async(req,res)=>{
  const datas = await getFleets("cabinet");
  res.render("mains/home",{fleets:datas});
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
router.get("/support", (req,res)=>{
  res.redirect("cabinet/chat");
});

router.use((req, res) => {
  res.status(404).render('mains/404-page');
})
//router.use(auth)
module.exports = router;