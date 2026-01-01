const { getTime, objRevised, expireDay, coll, formatDate, sortByDays, statusIcons, transformDatas, msgsStatus} = require("./utils");
const { Actions } = require("./action");
const { pagination } = require('../middlewares/pagination');

function setDatas(collection, _id) {
  return {
    type: "update",
    collection,
    redirect: `/admin/transactions/${collection}/view?_id=${_id}`,
    data: {},
  };
}

function checkBody(body) {
  return !body || !body._id ? "O corpo do formulário está vazio ou o _id está indefinido" : false;
}

const statusMap = {
  EmProgresso: "Aprovar",
  Concluido: "Concluir",
  Rejeitado: "Rejeitar",
  Anulado: "Anular",
};

function errorMsgs(type, collectionKey, statusKey) {
  const title = coll(collectionKey).title[0];
  const statusText = statusMap[statusKey] || statusKey;
  const messages = {
    cantProcess: `Este ${title} já não pode ser processado.`,
    empty: `${title} não foi encontrado!`,
    default: `${title} não tem a opção ${statusText} na sua lista de status.`,
    errorAc: `Erro ao ${statusText} ${title}.`,
    errorAcChild: `Erro ao atualizar ${statusKey} deste ${title}.`,
  };
  return messages[type] || "Erro desconhecido.";
}

class Deposit {
  constructor(body, fleet) {
    this.amount = body.amount;
    this.income = +(body.amount * (fleet.percentage / 100)).toFixed(2);
    this.totalIncome = +(this.amount + this.income).toFixed(2);
    this.status = "EmProgresso";
    this.date = getTime().fullDate;
    this.expireAt = expireDay(fleet.maturity);
  }
}

class Commission {
  constructor(from) {
    this.amount = Math.round(from.amount * 0.05);
    this.totalReceivable = this.amount;
    this.status = "Concluido";
    this.date = getTime().fullDate;
  }
}

module.exports.DepositsActions = async function (body, internal) {
  const bodyError = checkBody(body);
  if (bodyError) return bodyError;

  let deposit = await Actions.get("deposits", body._id, ["fleet"]);
  if (!deposit) return errorMsgs("empty", "deposits");
  if (/^(Concluido|Anulado)$/i.test(deposit.status)) return errorMsgs("cantProcess", "deposits");

  const datas = setDatas("deposits", body._id);

  switch (body.status) {
    case "EmProgresso": {
      const newDepositData = new Deposit(body, deposit.fleet);
      datas.data = newDepositData;
      const updatedDeposit = await Actions.update(deposit._id, datas, true);
      if (!updatedDeposit) return errorMsgs("errorAc", "deposits", "EmProgresso");

      let commission = await Actions.get("commissions", { from: updatedDeposit._id }, null, true);
      if (!commission) return true;

      const commissionData = {
        type: "update",
        collection: "commissions",
        data: new Commission(updatedDeposit),
      };

      const updatedCommission = await Actions.update(commission._id, commissionData, true);
      if (!updatedCommission) return errorMsgs("errorAcChild", "comissão", "deposits");

      const newBalance = await Actions.increment("users",commission.owner,"balance",commission.totalReceivable);
      if (!newBalance) return "Erro ao atualizar saldo.";

      return true;
    }
    case "Concluido": {
      datas.data = { status: "Concluido" };
      const updatedDeposit = await Actions.update(deposit._id, datas, true);
      if (!updatedDeposit) return errorMsgs("errorAc", "deposits", "Concluido");

      const newBalance = await Actions.increment("users",deposit.owner,"balance",deposit.totalIncome);
      if (!newBalance) return "Erro ao atualizar saldo.";
      return true;
    }
    case "Anulado": {
      datas.data = { status: "Anulado" };
      const updatedDeposit = await Actions.update(deposit._id, datas, true);
      if (!updatedDeposit) return errorMsgs("errorAc", "deposits", "Anulado");

      let commission = await Actions.get("commissions", { from: updatedDeposit._id }, null, true);
      if (!commission) return true;

      const commissionData = {
        type: "update",
        collection: "commissions",
        data: { status: "Anulado" },
      };

      const updatedCommission = await Actions.update(commission._id, commissionData, true);
      if (!updatedCommission) return errorMsgs("errorAcChild", "comissão", "deposits");

      return true;
    }
    case "Rejeitado": {
      datas.data = { status: "Rejeitado" };
      const updatedDeposit = await Actions.update(deposit._id, datas, true);
      if (!updatedDeposit) return errorMsgs("errorAc", "deposits", "Rejeitado");

      return true;
    }
    default:
      return errorMsgs("default", "deposits", body.status);
  }
};

module.exports.CommissionsActions = async function (body, internal) {
  const bodyError = checkBody(body);
  if (bodyError) return bodyError;

  let commission = await Actions.get("commissions", body._id);
  if (!commission) return errorMsgs("empty", "commissions");
  if (/^(Concluido|Anulado)$/i.test(commission.status)) return errorMsgs("cantProcess", "commissions");

  const datas = setDatas("commissions", body._id);

  switch (body.status) {
    case "Concluido":
      return "Comissões não são processadas neste modelo, se quiser processar vá para o depósito referente a esta comissão";
    case "Rejeitado":
      commission.status = "Rejeitado";
      const updatedCommission = await Actions.update(commission._id, datas, true);
      if (!updatedCommission) return errorMsgs("errorAc", "commissions", "Rejeitado");
      return true;
    default:
      return errorMsgs("default", "commissions", body.status);
  }
};

module.exports.WithdrawalsActions = async function (body, internal) {
  const bodyError = checkBody(body);
  if (bodyError) return bodyError;

  let withdrawal = await Actions.get("withdrawals", body._id);
  if (!withdrawal) return errorMsgs("empty", "withdrawals");
  if (/^(Concluido|Anulado)$/i.test(withdrawal.status)) return errorMsgs("cantProcess", "withdrawals");

  const datas = setDatas("withdrawals", body._id);

  if (body.status === "Rejeitado" || body.status === "Anulado") {
    withdrawal.status = body.status;
    const updatedWithdrawal = await withdrawal.save();
    if (!updatedWithdrawal) return errorMsgs("errorAc", "withdrawals", body.status);

    const balanceUpdated = await Actions.decrement("users", withdrawal.owner, "balance", withdrawal.amount);
    if (!balanceUpdated) return "Erro ao atualizar saldo.";

    return true;
  }

  if (body.status === "Concluido") {
    // implementar gateway de pagamento para enviar dinheiro ao usuário
    withdrawal.status = body.status;
    const updatedWithdrawal = await withdrawal.save();
    if (!updatedWithdrawal) return errorMsgs("errorAc", "withdrawals", body.status);
    return true;
  }

  return errorMsgs("default", "withdrawals", body.status);
};

function filterByDate(item){
  const d = {
    month: formatDate(getTime().fullDate).onlyMonthAndYear,
    today: formatDate(getTime().fullDate).onlyDate
  }
  return !d[item]? undefined : d[item];
}
module.exports.getTransactions = async function(mode,body,type,user){
  if(!/^(deposits|commissions|withdrawals)/i.test(type)){ 
    return{
      successed:false,
      texts: `Transações ${type} não existe!`
    }
  }
  if(mode === "cabinet" && !user){
    return{
      successed:false,
      texts: "Ops ocorreu um erro, tenta mais tarde"
    }
  }
  const query = mode === "cabinet" ? {owner:user._id} : null;
  const link = {path:`/cabinet/transactions/${type}`,queryString: body ? `${new URLSearchParams(body).toString()}` : ''};
  let results = await Actions.get(type, query,["gateway"]);
  let filteredData = [];
  if(results){
    const isAdmin = mode === "admin";
    const isDeposit = type === "deposits";
    for(let i in results){
      let transaction = results[i];
      const isIatured =  isDeposit && transaction.status === "EmProgresso" && formatDate(transaction.expireAt).secondsLength >= 0;
      const nesterDatas = {
        mode: mode,
        type:coll(type).title[1],
        transaction_type: type,
        icon :statusIcons[transaction.status],
        status: isIatured ? "Maduro" : transaction.status
      }
      results[i] = await transformDatas(results[i]._doc,true,nesterDatas);
    }
    results.sort(sortByDays);
    const states = {
      date: filterByDate(body.time),
      owner: body?.owner,
      status: body?.status,
      _id: body?._id
    }
    filteredData = results.filter((item) => {
      if(states.owner === item.owner || !states.owner){
        if ((states.date === item.date.onlyDate) || (states.date === item.date.onlyMonthAndYear) || !states.date){
          if (!states.status ||  states.status === item.status) {
            if(states._id == item._id || !states._id){
              return true;
            }
          }
        }
      }
      return false; 
    });
  }
  return {
    type:type,
    successed: true,
    title:coll(type).title[1],
    datas:pagination(filteredData,!body.page?0:body.page, link, true)
  }
}

module.exports.getTransaction = async function( mode, type, _id){
  const isAdmin = mode === "admin";
  const isDeposit = type === "deposits";
  const populete = ["gateway","owner"];
  if(isDeposit){populete.push("fleet");};
  
  let datas = await Actions.get(type, _id, populete);
  console.log(datas)
  if(!datas){ 
    return{
      successed: false,
      btnTitle: "Voltar atrás",
      redirectTo: null,
      texts: "Essa transação esta indisponível"
    }
  }
  datas = await transformDatas(datas._doc,true);
  const isPaymentInstantly = datas.gateway.paymentInstantly ? true : false;
  const isIatured = isDeposit && datas.status === "EmProgresso" && datas.expireAt.secondsLength >= 0;
  
  const newTransactionDatas ={
    isAdmin: isAdmin,
    shows: msgsStatus(datas.status,type),
    paymentInfo: /^(Pendente|Rejeitado)$/i.test(datas.status),
    [type]: true,
    transaction_type: type,
    type: coll(type).title[0],
    contact_us: /^(Rejeitado|Anulado)$/i.test(datas.status),
    status: isIatured ? "Maduro" : datas.status,
  }
  if(isDeposit){
    newTransactionDatas.showsBtn = {
      default: datas.status === "Pendente" && isDeposit && isPaymentInstantly,
      status: datas.status === "Rejeitado" && isDeposit && isPaymentInstantly
    }
  }
  
  const showBtns = /^(Pendente|Rejeitado)$/i.test(datas.status) ||  datas.status === "EmProgresso" && datas.expireAt.secondsLength > 0 ;
  const btnsArray = [
    {value: type !== "deposits"? "Processar" : isIatured && isAdmin ? "Processar" : "Confirmar", action: type !== "deposits"? "Concluido" : isIatured && isAdmin ? "Concluido" : "EmProgresso", icon:"bi bi-check-circle"},
    {value: "Rejeitar",action:"Rejeitado",icon:"bi bi-slash-circle"},
    {value: "Anular",action:"Anulado",icon:"bi bi-arrow-left-circle"}
  ];
  let transaction = objRevised(datas ,newTransactionDatas);
  console.log(transaction)
  return{
    successed:true,
    btns: showBtns ? btnsArray : null ,
    datas: transaction
  }
};


module.exports.getAccounts = async function(user, withdrawals) {
  const query = withdrawals ? { owner: user._id, status: { $in: ["Concluido", "EmProgresso"]}} : { owner: user._id };
  const deposits = await Actions.get("deposits", query) || [];
  let accounts = [...new Set(deposits.map(d => d.account).filter(Boolean))];
  const accountsMap = accounts.map(account => ({ account }));
  return accountsMap;
};