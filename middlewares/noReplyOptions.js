const express = require("express");
const {getTime} = require('./utils');
const baseUrl = process.env.HOST;
const protocol = process.env.PROTOCAL;
// no-reply emails options
module.exports.noReplyOptions = async function(user, type){
  //const settings = await Administration.find().exec();
  const companyName = "Avvimo" //settings[0].companyname;
  const datas = {
    verifyaccount:{
      path: `${protocol}${baseUrl}/auth/account-verification?id=${user._id}`,
      subject: "Verifique sua conta "+companyName,
      template: 'emails/account-verification'
    },
    resetpassword:{
      path: `${protocol}${baseUrl}/auth/reset-password?token=${user._id}`,
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
      path: `${protocol}${baseUrl}/admin/alerts`,
      subject: "Uma tentativa de entrar no admin!",
      template: 'email/unauthorizedNavigator'
    }
  }
  return{
    from: ''+companyName+'"no-replay@avvimo.com"', // sender address
    to: user.email,
    subject: datas[type].subject,
    template: datas[type].template, 
    context:{
      logo: `${protocol}${baseUrl}/imgs/logo1.png`,
      name: user.name,
      email: user.email,
      companyName: companyName,
      location:"1120 Facim, Marracuene Maputo, Moçambique",
      link: datas[type].path,
      year: getTime().onlyYear,
      baseLink: `${protocol}${baseUrl}`
    }
  }    
}
