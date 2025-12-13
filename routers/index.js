const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const {Actions} = require('../middlewares/action');
const {quote} = require('../middlewares/quotes');

router.get('/', async(req,res)=>{
  console.log(req.isAuthenticated())
  res.render("mains/home");
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

router.get("/reviews",(req,res)=>{
  res.render("mains/reviews");
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


router.use((req, res) => {
  res.status(404).render('mains/404-page');
})
//router.use(auth)
module.exports = router;