import React, {useState,useEffect} from "react";
import {signIn, useAuth, signUp,dbUsers,dbImages,dbChats, signInAnonymously} from '../auth/FirebaseConfig.js';
import {texts} from "../texts/Texts.js";
import {Alert, Toast,getColor,getCurrentTime} from "./Utils.js";


const Authtication = ({language,id,onAuth}) =>{
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  const isAuth = useAuth();
  const [states, setStates] = useState({loading: false});
  const [error,setError]=useState({email:null,password:null, error:{text:null, stack:null}});
  const e = {
    email: `${id}@gmail.com`,
    password:id
  }
  
  async function handleSignIn(){
    try{
      const res = await signIn(e.email,e.password);
      const response = await res;
      if(response){setStates(prevState=>({...prevState,loading:false}));
      onAuth(false);
     }
    }catch(error){
      console.error(error);
      if(error.code === "auth/user-not-found"){
        handleSignUp();
      }else{
      for(let i = 0; i < authErros.length; i++){
        if(error.code === authErros[i].name){
          let errorMessage = texts[authErros[i].target][language]; // exemplo: texts.invalidPassword.ptPT retona "Senha inválido!"
          let stack = authErros[i].stack;
          setError(prevError=>({...prevError,error:{text:errorMessage,stack:stack}}));
          setStates(prevState=>({...prevState,loading:false}));
        }else{
          setError(prevError=>({...prevError,error:{text:error,stack:"error"}}));
        }
      }
      }
    }
  }
  async function handleSignUp(anonymous){
    const newUser = function(id = "unknown", uid, email){
      return {
        id: uid,
        name: `Guest ${id}`,
        email: email,
        isAdmin:false,
        isBanned :false,
        online:getCurrentTime().fullDate,
        avatar:"",
        date: getCurrentTime().fullDate
      }
    }
    
    try{
      let res ;
      if(anonymous){
        res = await signInAnonymously();
        console.log(res)
      }else{
        res = await signUp(e.email,e.password);
      }
      const response = await res;
      const user = newUser(id, response.uid, e.email);
      dbUsers.child(response.uid).set(user).then(()=>{
          dbImages.child(response.uid).set({id:response.uid,src:""}).catch((error)=>{
            setError(prevError=>({...prevError,error:{text:error.message,stack:"error"}}));
          });
          dbChats.child(response.uid).set({
            id:response.uid,
            owner:response.uid,
            individuals:true,
            participants:{
              [response.uid]:{
                typing:false,
                blocked:false,
                datas:"",
              }
            },
            chatColor:getColor(),
            data:""
          }).then(()=>{
            onAuth(false);
          }).catch((error)=>{
            setError(prevError=>({...prevError,error:{text:error.message,stack:"error"}}));
          });
       
      }).catch((error)=>{
        setError(prevError=>({...prevError,error:{text:error.message,stack:"error"}}));
      });
    }catch(error){
      for(let i = 0; i < authErros.length; i++){
        if(error.code === authErros[i].name){
          let errorMessage = texts[authErros[i].target][language]; // exemplo: texts.invalidPassword.ptPT retona "Senha inválido!"
          let stack = authErros[i].stack;
          setError(prevError=>({...prevError,error:{text:errorMessage,stack:stack}}));
          setStates(prevState=>({...prevState,loading:false}));
        }
      }
    }
  }
  useEffect(()=>{
    setStates(prevState=>({...prevState,loading:false}));
    if(id){
      const errorMessage = texts.authenticate[language];
      setError(prevError=>({...prevError,error:{text:errorMessage,stack:"error"}}));
      handleSignIn();
    }else{
      
      if(isAuthenticated === ""){
        console.log(isAuthenticated)
        const errorMessage = texts.authenticate[language];
        setError(prevError=>({...prevError,error:{text:errorMessage,stack:"error"}}));
        handleSignUp(true);
      }else{
        const errorMessage = texts.occuredError[language];
        setError(prevError=>({...prevError,error:{text:errorMessage,stack:"error"}}));
        onAuth(false);
      }
    }
  },[id]);
  return (
    <div>
      {states.isLoading && <Loader language={language}/> ||
      <div className="flex_c_c empty_card">
      <i style={{color:"red"}} className="bi bi-exclamation"></i>
      <p>{error.error.text}</p>
    </div>
      }
    </div>
  );
}

export default Authtication;