const express = require("express");
const {getTime,formatDate} = require('./utils');
const baseUrl = process.env.HOST;
const protocol = process.env.PROTOCAL;
// no-reply emails options
module.exports.noReplyOptions = async function(item, type){
  const companyName = process.env.COMPANY;
  const datas = {
    verifyaccount:{
      path: `${protocol}${baseUrl}/auth/account-verification?id=${item._id}`,
      subject: "Verifique sua conta "+companyName,
      template: 'emails/account-verification'
    },
    verificarionAlert:{
      path: `${protocol}${baseUrl}/auth/account-verification?id=${item._id}`,
      subject: "Verifique sua conta "+companyName,
      template: 'emails/verificarionAlert'
    },
    resetpassword:{
      path: `${protocol}${baseUrl}/auth/reset-password?token=${item._id}`,
      subject: "Você solicitou alteração da senha",
      template: 'emails/reset-password'
    },  
    passwordchanged:{
      path: `${protocol}${baseUrl}/cabinet/dashboard`,
      subject: "Nova senha definida com sucesso!",
      template: 'emails/password-changed'
    },
    requestdeleteaccount:{
      path: `${protocol}${baseUrl}/cabinet/dashboard`,
      subject: "Você pediu pra deletar sua conta!",
      template: 'emails/deleteAccount'
    },
    unauthorizedNavigator:{
      path: `${protocol}${baseUrl}${item.path}`,
      subject: "Uma tentativa de navegação na area de administração!",
      template: 'emails/unauthorizedNavigator'
    },
    withdrawalsFunds:{
      path: `${protocol}${baseUrl}/cabinet/transactions/deposits/view?_id=${item._id}`,
      subject: "Saque concluido com sucesso!",
      template: 'emails/withdrawalsFunds'
    },
    unauthorizedAdmin:{
      path: `${protocol}${baseUrl}${item.path}`,
      subject: "Alerta!",
      template: 'emails/unauthorizedAdmin'
    },
    bruteForceAlert:{
      path:null,
      subject: "Alerta!",
      template: 'emails/bruteForceAlert'
    },
    verifyingIdentity:{
      path:null,
      subject: "Verifica a sua identidade!",
      template: 'emails/code'
    },
    depositNewsletter:{
      path: `${protocol}${baseUrl}/cabinet/fleets`,
      subject: `Começar a facturar ${item?.name.split(" ")[0]}`,
      template: "emails/depositNewsletter"
    },
    warningBan:{
      path: `${protocol}${baseUrl}/cabinet/deposits`,
      subject: `Evita ser bloqueado(a) ${item?.name.split(" ")[0]}`,
      template: "emails/warningBan"
    },
    customized:{
      path: null,
      subject: item?.subject,
      template: "emails/template"
    }
  }
  return{
    from: ''+companyName+'"no-replay@avvimo.com"', // sender address
    to: item.email,
    subject: datas[type].subject,
    template: datas[type].template, 
    context:{
      logo: `${protocol}${baseUrl}/imgs/logo1.png`,
      name: item.name.split(" ")[0],
      email: item.email,
      guestEmail: item?.guest?.email ,
      amount: item?.amount,
      code: item?.bruteForce?.code,
      time: formatDate().fullDate,
      agentDetails: item?.agentDetails,
      innerHtml: item?.innerHtml,
      companyName: companyName,
      location:"1120 Facim, Marracuene Maputo, Moçambique",
      link: datas[type].path,
      year: getTime().onlyYear,
      baseLink: `${protocol}${baseUrl}`,
      supportUrl: `${protocol}${baseUrl}/contact-us?id=${item._id}`
    }
  }    
}
