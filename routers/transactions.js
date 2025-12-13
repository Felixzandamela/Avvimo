
const express = require("express")
const router = express.Router();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const {transformDatas,getTime,objRevised,propertysLength,statusIcons,msgsStatus,formatDate} = require('../middlewares/utils');
const {pagination} = require('../middlewares/pagination');
const {expireDay} = require('../middlewares/expireDays');
const {Actions} = require('../middlewares/action');


const alertDatas = {
  type:"error",
  title:"Erro!",
  texts: "Houve um erro, por favor tente mais tarde. Se o erro persistir, por favor contacte-nos atrás dos nossos canaís.",
  btnTitle: "Painel",
  redirectTo: "/dashboard"
}

const transTypes = {
  deposits:"Deposíto",
  withdrawals:"Saques",
  commissions:"Comissão"
}



const a = [{
      name:"Antonio",
  status:"Pendente",
  amount:200,
  gateway:{
    name:"Mcash",
  },
  date:["09",10,2025,"12:33:33"]
},{
  name:"Antonio",
  amount:100,
  status:"Rejeitado",
  gateway:{
    name:"Vodacom",
  },
  date:["09",10,2025,"12:33:33"]
},{
  name:"Antonio",
  amount:209,
  status:"Comcluido",
  gateway:{
    name:"Vodacom",
  },
  date:["09","09",2025,"12:33:33"]
}];

router.get("/:type", urlencodedParser, async (req,res)=>{
  const type = req.params.type;
  const link = {path:`/transactions/${type}`,queryString: req.query ? `${new URLSearchParams(req.query).toString()}` : ''};
  const body = await transformDatas(req.query);
  let querys = propertysLength(body) > 0 ? body : null;

  if(/^(deposits|commissions|withdrawals)/i.test(type)){
    let results = await Actions.get(type, querys,["gateways"]);
    if(a){
      
      for(let i in a){
        const nesterDatas = {
          types:transTypes[type],
          transaction_type: type,
          icon :statusIcons[a[i].status],
        }
        a[i] = await transformDatas(a[i],true,nesterDatas);
      }
    }
    console.log(a)
    a.sort(sortByDays);
    
    const datas= (pagination(a,!body.page?0:body.page, link, true));
    res.render("cabinet/transactions",{type:type, title:transTypes[type], datas:datas});
  }else{
    const g = objRevised(alertDatas, {texts:"Esse tipo de transações não existe!"});
    res.render("cabinet/catchs", g);
  }
});

router.get("/:type/view", urlencodedParser, async (req,res)=>{
  const {type} = req.params;
  const {_id} = req.query;
  
  
  class NewDeposit{
    constructor(){
      this.owner = "222331355";
      this.amount = 200;
      this.income = (this.amount * (50 /100));
      this.totalIncome = this.amount + this.income;
      this.fleet ={
        name:"Standard",
        _id: "33ee"
      };
      this.status = "Pendente";
      this.account="843434027",
      this.gateway= {
        src:"/imgs/images.png",
        _id:2,
        paymentInstantly:true,
        name:"Vodacom",
        account:"8423343402",
        owner:"Felix Zanfa"
      };
      this.date = getTime().fullDate;
      this.expireAt =  expireDay(15);
    }
  }
  let datas = new NewDeposit();
  const isDeposit = type === "deposits" && datas.status === "Emprogresso" && formatDate(datas.expireAt).secondsLength >= 0 ? "Comcluido" : "Emprogresso";
  const nesterDatas ={
    shows: msgsStatus(datas.status,type),
    [type]: true,
    transaction_type:type,
    type: transTypes[type],
    date: formatDate(datas.date).fullDate,
    contact_us: /^(Rejeitado|Anulado)$/i.test(datas.status),
  }
  if(datas.expireAt){
    nesterDatas.expireAt = formatDate(datas.expireAt).fullDate;
  }
  if(type === "deposits"){
    nesterDatas.showsBtn = {
      default: datas.status === "Pendente" && type === "deposits"? true : false,
      status: datas.status === "Rejeitado" ? true : false
    }
  }
  
  const showBtns =!/^(Comcluido|Anulado)$/i.test(datas.status);
  const btnsArray = [
    {value: isDeposit === "Emprogresso"? "Confirmar" : "Processar", action: isDeposit ? isDeposit : "Comcluido", icon:"bi bi-check-circle"},
    {value: "Rejeitar",action:"Rejeitado",icon:"bi bi-slash-circle"},
    {value: "Anular",action:"Anulado",icon:"bi bi-arrow-left-circle"}
  ];
  datas = objRevised(datas,nesterDatas);
  console.log(btnsArray)
  res.render("cabinet/transactionCard",{type:type, _id:_id, btns: showBtns? btnsArray : null ,datas: datas});
});


module.exports = router;