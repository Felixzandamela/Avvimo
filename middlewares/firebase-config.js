const express = require("express");
const firebase = require('firebase/firebase-app.js');
const {initializeAuth,onAuthStateChanged} = require('firebase/auth');
const firebaseConfig = {
  apiKey: "AIzaSyAQmGE66ACzypXy-bzT6bXtEJ-IHf8ANMg",
  authDomain: "bettimers.firebaseapp.com",
  databaseURL: "https://bettimers-default-rtdb.firebaseio.com",
  projectId: "bettimers",
  storageBucket: "bettimers.appspot.com",
  messagingSenderId: "926730575178",
  appId: "1:926730575178:web:280198eab648a1432675b3",
  measurementId: "G-E0ZL9RFHH1"
};

const fb = firebase.initializeApp(firebaseConfig);
//auth.initializeAuth(fb)
//const auth(fb);
console.log(onAuthStateChanged)
module.exports.useAuth = function(){
  /*
  let cutre = null;
    const isAuthticated = onAuthStateChanged (user => {
      let a = user ? user.uid : "";
     // localStorage.setItem("isAuthenticated", a);
      if(user && !user.emailVerified){
        user.sendEmailVerification().then(()=>{
          //navigate(`/message?type=error&field=register&reason=email-verification`,{replace:true});
        });
      }
    });*/
    return onAuthStateChanged();
}
