import React,{useState, useEffect,useRef} from "react";
import {texts} from "../texts/Texts.js";
import {Avatar,Alert,ShareLink,MinLoder,formatDate,getCurrentTime,idGenerator, getColor,EmptyCard,Loader, Toast,useFileName,chackeVal} from "./Utils.js";
import {currentUser, useAuth, dbChats, dbFaqs,dbUsers,dbImages} from '../auth/FirebaseConfig.js';
import {ImageViewer,ImageCropper} from "./ImageTools.js";

const Chat = ({language, id, mode,onCloseChat})=>{
  const isAuth = useAuth();
  const user = currentUser(false);
  const isMounted = useRef(true);
  const bottom = useRef(null);
  const textarea = useRef(null);
  const containHtml = /<|>|<[a-z][\s\S]*>/i;
  const [chatId,setChatId] = useState(null);
  const [fileName, setFileName,clearFileName] = useFileName(null);
  const [states,setStates] = useState({loading:false,isLoading:false,images:null, actions:null,index:null,actionFaqsPopup:null,viewFaqsPopup:null, props:{action:"set",type:null,id:null,text:null}});
  const [alertDatas, setAlertDatas] = useState(null);
  const [datas, setDatas] = useState(null);
  const [chat, setChat]= useState(null);
  const [error,setError]=useState({ error:{text:null,stack:null}});
  const [values, setValues]=useState({text:"",images:[]});
  const [newMsg,setNewMsg] = useState(null);
  const [header,setHeader] = useState(null);
  
  useEffect(()=>{
    setStates(prevState=>({...prevState,isLoading:true}));
    if(id){setChatId(id);}else{
      if(isAuth && isAuth.uid){setChatId(isAuth.uid);}
    }
  },[id,isAuth]);
  
  /*
* Este trecho de código inclui um hook useEffect que é executado sempre que 'datas' ou 'current' mudam.
* Ele verifica se 'datas', 'datas.data' e 'current' existem e, em seguida, processa os dados para combinar mensagens de chat semelhantes com base no tempo e no autor.
* Em seguida, atualiza o estado do chat com os novos dados processados.
* Também verifica mensagens não visualizadas e as marca como visualizadas.
*/
  const isPropertyDefined = (obj, property) => {
    return obj !== undefined && obj[property] !== undefined;
  };
  //carregando dados do chat
  useEffect(() => {
    const handleChatAdded = snapChat => {
      if(snapChat.exists()){
        const newChat = snapChat.val();
        if(isAuth){
          if(!isPropertyDefined(newChat.participants, isAuth.uid)){
            dbChats.child(newChat.id).child('participants').child(isAuth.uid).set({
              typing:false,
              blocked:false,
              datas:""
            }).then(()=>{handleNewChat(newChat);}).catch(()=>{setError(prevError=>({...prevError,error:{text:error.message,stack:"error"}}));});
          }else{handleNewChat(newChat);}
        }
      } //else
    }
    const handleNewChat = (newChat)=>{
      const promises = [];
      const getImage = (imageId) => {
        return new Promise((resolve, reject) => {
          dbImages.child(imageId).on("value", (snapImages) => {
            resolve(snapImages.val());
          });
        });
      };
      const participants = {};
      const participantsPropertyNames = Object.getOwnPropertyNames(newChat.participants);
      const participantsPromises = participantsPropertyNames.map(participantId => {
        return new Promise((resolve, reject) => {
          dbUsers.child(participantId).on("value", (snapUser) => {
            const participant = snapUser.val();
            if(participant){
              dbImages.child(participantId).on("value",(snapAvatar)=>{
                const avatarData = snapAvatar.val();
                if(avatarData !== null){
                  participant.avatar = avatarData.src;
                  participants[participantId] = participant;
                  newChat.participants[participantId].datas = participant;
                }
                resolve();
              });
            } else {resolve();}
          });
        });
      }); //resolve participant datas
      Promise.all(participantsPromises).then(() => {
        if(typeof newChat.data === "object") {
          for (let k in newChat.data) {
            if (participants[newChat.data[k].autor]) {
              newChat.data[k].autor = participants[newChat.data[k].autor];
              let imagesId = typeof newChat.data[k].msg.images !== "object" ? (newChat.data[k].msg.images !== "" ? newChat.data[k].msg.images : "") : newChat.data[k].msg.images.id;
              if (imagesId !== "") {
                promises.push(getImage(imagesId).then((imageData) => {
                  newChat.data[k].msg.images = imageData;
                }));
              }
            }
          } // set autors  datas
        }else{
          newChat.data = [];
          setDatas(newChat);
        }
        Promise.all(promises).then(() => {
          setStates(prevState=>({...prevState,isLoading:false}));
          setDatas(newChat);
        });
      });
    };
    if (chatId && isAuth) {
      dbChats.child(chatId).on("value", handleChatAdded);
      dbChats.child(chatId).on("child_changed", () => {
        setDatas(null);
        setChat(null);
        dbChats.child(chatId).on("value", handleChatAdded);
      });
    }
    return () => {
      if(chatId) {
        dbChats.child(chatId).off("child_changed", handleChatAdded);
        dbChats.child(chatId).off("value", handleChatAdded);
      }
    };
  }, [chatId,isAuth]);
  
  useEffect(()=>{
    if(datas && datas.data && isAuth){
      const index = 0;
      // Reduzir mensagens semelhantes
      const newData = datas.data.reduce((acc, item,id) => {
        const index = acc.findIndex(el => formatDate(el.time,language).minutesLength === formatDate(item.time,language).minutesLength && el.autor.id === item.autor.id);
        item.msg["position"] = id;
        item.msg["id"] = item.id;
        if (index >= 0) {
          acc[index].messages.push(item.msg);
        } else {
          acc.push({
            chat: item.chat,
            time: item.time,
            autor: item.autor,
            messages:[item.msg],
            seen : item.seen
          });
        }
        return acc;
      }, []);
      setChat((prevState)=>(prevState === newData? null:newData));
      // Marcar mensagens não visualizadas como visualizadas
      let noSeens = [];
      for(let k in datas.data){
        if(isAuth && !datas.data[k].seen && datas.data[k].autor.id !== isAuth.uid){
          dbChats.child(datas.id).child("data").child(k).update({
            seen: true
          });
        }
      }
      const support = {
        typing:false,
        blocked:false,
        datas:{avatar:"",name: "Support", online:"online"}
      }
      const messagesReversed = datas.data.reverse();
      const senders = Object.values(datas.participants);
      if(messagesReversed.length <= 0){
        if(senders.length > 1){
          setHeader(senders[senders.length - 1])
        }else{
          setHeader(support);
        }
      }else{
        for(let n in messagesReversed){
          if(messagesReversed[n].autor.id !== isAuth.uid){
            datas.owner = datas.participants[messagesReversed[n].autor.id];
            setHeader(datas.owner);
            break;
          }
          if(n <= 0 && messagesReversed[n].autor.id === isAuth.uid){
            setHeader(support);
          }
        }
      }
    } // set header datas from current sender 
  },[datas,isAuth]);
  //Assim que os dados de chat forem carregados, rola para baixo  
  
  useEffect(()=>{
    const timeout = setTimeout(()=>{
      if(isMounted.current && chat){
        scrollToBottom();
      }
    },1000);
    return ()=>{
      clearTimeout(timeout);
    }
  },[chat]);
  
  /*
  *Atualizar o novo texto nos valores
  *Aumentar o tamanho da area do texto assim que digitar
  */
 const handleTextChange=(event)=>{
    const {name,value}=event.target;
    setValues(prevValue=>({...prevValue,[name]:value}));
    setError(prevError=>({...prevError,[name]:null}));
    event.target.style.height = 'auto';
    event.target.style.height = (event.target.scrollHeight) + 'px';
    scrollToBottom();
  }
  
  //Nova mensagem com todos os respeitivos dados
  class NewMessage{
    constructor(chatId, autor){
      this.autor = autor,
      this.id = idGenerator(21),
      this.chat = chatId,
      this.msg = {
        images :"",
        text : values.text
      };
      this.time = getCurrentTime().fullDate,
      this.seen = false
    }
  }
  
  //Carregar dados da nova mensagem assim que for digitado
  useEffect(()=>{
    if(isAuth){
      let nId = isAuth ? isAuth.uid : null;
      if(nId){
        const sendNewMsg = new NewMessage(chatId, nId);
        setNewMsg(sendNewMsg);
      }
    }
    if(textarea){
      textarea.current.addEventListener('blur', function() {onTyping(false);});
    }
  },[values, chatId, isAuth]);
  
  //Ação para verificar valores e enviar uma nova mensagem assim que atender os requisitos
  const handleSubmit=(event) => {
    const errors = [];
    event.preventDefault();
    if(values.text.length <= 0 && values.images.length <=0){errors.push(1);}
    if(values.text.match(containHtml)){setError(prevError=>({...prevError,error:{text:texts.containHtml[language],stack:"error"}}));errors.push(1);}
    if(!errors.length > 0){setStates(prevState=>({...prevState,loading:true}));
    handleSend();}
  }
  
  const handleSaveAvatar = (e)=>{
    setValues(prevValue=>({...prevValue,images:[...values.images,e]}));
    clearFileName();
  }// add new image into arry off images
  const deleteImage=(id)=>{
    values.images.splice(id, 1);
    setValues(prevValue=>({...prevValue,images:[...values.images]}));
  }//delete image into arry off images
 
  const addImags =(newImages)=>{
    if(newImages.images.length > 0){
      dbImages.child(newImages.id).set(newImages).catch((error)=>{
        console.log(error);
        setStates(prevState=>({...prevState,loading:false}));
        setError(prevError=>({...prevError,error:{text:texts.occuredError[language],stack:"error"}}));
      });
    } 
  } // add new images message
  
  const removeImage =(e)=>{
    const id = typeof e === "object" ? e.id : e;
    if(id){dbImages.child(id).remove().catch((error)=>{console.log(error);});}
  }// remove images of messages
  
  const handleSend = () => {
    if (newMsg) {
      const newImages = {
        id:idGenerator(14),
        images:values.images
      }
      newMsg.msg.images = newImages.images.length <=0 ? "": newImages.id;
      dbChats.child(newMsg.chat).child('data').transaction((currentMessages) => {
        if(currentMessages){
          const recentMessages = currentMessages.slice(-19);
          recentMessages.push(newMsg);
          addImags(newImages);
          return recentMessages;
          //this chat accept only 20 messages,  old messages are automactly being deleted
        }else{
          addImags(newImages);
          return[newMsg];
          //if data length = 0 in the dbChats.data create new array off messages
        }
      }).then(() => {
        setStates(prevState=>({...prevState,loading:false}));
        setValues(prevValue=>({...prevValue,text:"",images:[]}));
        textarea.current.style.height = 'auto';
        scrollToBottom();
        console.log("Mensagem enviada com sucesso");
      }).catch((error) => {
        setStates(prevState=>({...prevState,loading:false}));
        setError(prevError=>({...prevError,error:{text:texts.occuredError[language],stack:"error"}}));
        console.error("Erro ao enviar mensagem:", error);
      });
    }
  }; // sending message event
  
  const handleClear = (e)=>{
    const alertData = {
      header:false,
      text:e === "single" ? texts.confirmRemoveMsg[language] : texts.confirmClearConversation[language],
      dangerText: texts.cannotBeUndone[language],
      actions:{
        onOk:{
          action: e,
          title: e === "single" ? texts._delete[language] : texts.clearNow[language],
          type:"danger"
        }
      }
    }
    setAlertDatas(alertData);
  }// set new alert actions
  
  const handleCancel = () =>{
    setAlertDatas(null);
    setStates(prevState=>({...prevState,actions:null,index:null}));
  }// cansel alert eventListener
  
  const handleAction =(event)=>{
    if(states.actions && event === "single"){
      const {position,images} = states.actions;
      dbChats.child(newMsg.chat).child('data').transaction((currentMessages) => {
        if(currentMessages){
          currentMessages.splice(position,1);
          const recentMessages = [...currentMessages];
          if(!images || images !== undefined){removeImage(images);};
          return recentMessages;
        }
      }).then(()=>{
        setAlertDatas(null);
        setStates(prevState=>({...prevState,actions:null,index:null}));
      }).catch((error) => console.log(error));
    }else{
      setChat(null);
      for(let f in datas.data){
        let imagesId = datas.data[f].msg.images && datas.data[f].msg.images.id !== undefined ? datas.data[f].msg.images.id : null;
        if(imagesId !== null){removeImage(imagesId);}
      }
      dbChats.child(chatId).child('data').transaction((currentMessages) => {return "";}).then(()=>{
        setAlertDatas(null);
        setError(prevError=>({...prevError,error:{text:texts.chatClearedCuccessfully[language],stack:"success"}}));
      }).catch((error)=>{
        setAlertDatas(null);
        setError(prevError=>({...prevError,error:{text:error.message,stack:"error"}}));
      });
    }
  }
  /* delete messages
  **single - delete one message
  */
  
  const onTyping = (t) =>{
    if(isAuth && isMounted.current && isAuth.uid !== null){
      dbChats.child(chatId).child("participants").child(isAuth.uid).child("typing").transaction((typing)=>{
        typing = t;
        return typing;
      }).catch((error)=>{console.log(error)});
    }
  }// typing eventListener
  
  function scrollToBottom(){
    bottom.current.scrollIntoView({
      behavior: "smooth", 
      block: "start",
      inline: "nearest"
    });
  }// scrollIntoView last message
  const color = localStorage.getItem('avatarColor');
  const MAX_DISPLAY = 5, maxDisplay = 4;
  const setImages = (e)=>{
    setStates(prevState=>({...prevState,images:e}));
  }
  
  const handleATop = (message,index)=>{
    setStates(prevState=>({...prevState,actions:message, index:message.id}));
  }
  
  const handleToggle = (c = null, a = "set", i = null, t = "")=>{
    setStates(prevState=>({...prevState,actionFaqsPopup:c, props:{action:a,id:i,text:t}}));
  }
  
  
  const handleReplyAction = function(e,a, item){
    switch(a){
      case "update":
        handleToggle(e, "update", item.id, item.text);
        handleReplyAction();
      break;
      case "send":
        textarea.current.focus();
        setValues(prevValue=>({...prevValue,text: item.text}));
        handleReplyAction(); // re-call
      break;
      default:
        setStates(prevState=>({...prevState,viewFaqsPopup:e || ""}));
      break;
    }
  }
  return(
    <div className="a_chat">
      <ImageViewer language={language} datas={states.images} onClose={()=>setStates(prevState=>({...prevState,images:null}))}/>
      <Alert language={language} alertDatas={alertDatas} onOk={(event)=>handleAction(event)} onCancel={handleCancel}/>
      <Toast props={error.error} onClear={()=>setError(prevError=>({...prevError,error:{text:null,stack:null}}))}/>
      <FaqsForm language={language} type={states.actionFaqsPopup} props={states.props} handleToggle={()=>handleToggle()}/>
      
     {states.viewFaqsPopup && <AutoFaqs language={language} type={states.viewFaqsPopup} mode={mode} handleReplyAction={(c,t,i)=>handleReplyAction(c,t,i)}/>}
      
      {states.actions && <div className="a_chat_header a_container flex_b_c">
        <div className="flex_b_c">
          <div onClick={()=>setStates(prevState=>({...prevState,actions:null,index:null}))} className="flex_c_c btn_circle br60"> 
            <svg className="" fill="currentColor" opacity="1.0" baseProfile="full" width="24" height="24" viewBox="0 0 24.00 24.00">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
            </svg>
          </div>
        </div>
        <div className="flex_c_c">
          <div style={{marginRight:"20px"}} className="btn_circle br60 flex_c_c">
            <ShareLink language={language} value={states.actions.text}/>
          </div>
          <div onClick={()=>handleClear("single")} className="btn_circle br60 flex_c_c">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-trash3" viewBox="0 0 16 16">
              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
            </svg>
          </div>
        </div>
      </div>
      ||
      <div className="a_chat_header a_container flex_b_c">
        <div className="flex_b_c">
          {mode === "admin" && <div onClick={onCloseChat} className="flex_c_c br60 btn_circle a_close_chat"> 
            <svg fill="currentColor" opacity="1.0" baseProfile="full" width="26" height="26" viewBox="0 0 24.00 24.00"><path d="M20 11v2H7.99l5.505 5.505-1.414 1.414L4.16 12l7.92-7.92 1.414 1.415L7.99 11H20z"/></svg>
          </div>}
          <div className="flex_s">
            <div onClick={scrollToBottom} className="a_chat_avatar">
              {header && <Avatar avatar={header.datas} color={datas && datas.chatColor}/>}
            </div>
             {header && <div className="a_chat_mames">
              <h1 className="ellipsis">{header && header.datas.name}</h1>
              <div className="a_sender_status"> {header && header.typing && <span style={{color:"var(--main-color)"}}> <i>{texts.typing[language]}</i></span> || 
                <span>{header && typeof header.datas.online === "object" && `${texts.lastSeen[language]} ${formatDate(header.datas.online, language).timeAgo}` || header.datas.online}</span> 
                }
              </div>
            </div>}
          </div>
        </div>
        <div className="flex_c_c">
          {chat && <div className="btn_circle br60 flex_c_c">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots-vertical" viewBox="0 0 16 16">
              <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
            </svg>
            {mode === "admin" &&
              <div className="a_c_menu a_container_br br4-a">
                
                <div className="padd6-10 flex_s_c" onClick={()=>handleClear("all")}><i className="bi bi-trash3 m5-r"></i><p className="ellipsis">{texts.clearThisConversation[language]}</p></div>
                
                <div className="padd6-10 flex_s_c" onClick={()=>handleReplyAction("question")}><i className="bi bi-chat-text m5-r"></i><p className="ellipsis">{texts.automaticQuestions[language]}</p></div>
                <div className="padd6-10 flex_s_c" onClick={()=>handleReplyAction("reply")}><i className="bi bi-chat-text m5-r"></i><p className="ellipsis">{texts.automaticReplys[language]}</p></div>
               
                <div className="padd6-10 flex_s_c" onClick={()=>handleToggle("reply","set")}><i className="bi bi-chat-text m5-r"></i><p className="ellipsis">{texts.automaticReply[language]}</p></div>
               <div className="padd6-10 flex_s_c" onClick={()=>handleToggle("question","set")}><i className="bi bi-chat-text m5-r"></i><p className="ellipsis">{texts.automaticQuestion[language]}</p></div>
                <a href={`http://localhost:8089/admin/users?id=${header.datas.profileKey}`} target="_blank" className="a padd6-10 flex_s_c"> <i className="bi bi-person"></i> <p className="ellipsis">{texts.viewProfile[language]}</p></a>
              </div>||
              <div className="a_c_menu a_container_br br4-a">
                <div className="padd6-10 flex_s_c" onClick={()=>handleReplyAction("question")}><i className="bi bi-chat-text m5-r"></i><p className="ellipsis">{texts.automaticQuestions[language]}</p></div>
                <div className="padd6-10 flex_s_c" onClick={()=>handleClear("all")}><i className="bi bi-trash3 m5-r"></i><p className="ellipsis">{texts.clearThisConversation[language]}</p></div>
              </div>
            }
          </div>}
        </div>
      </div>
      }
      <div className="a_chat_roller a_scroll_bar">
        {states.isLoading && <Loader language={language}/> ||
          <div>{chat && chat.length <= 0 &&<AutoMsg language={language} owner={header.datas} datas={datas}/>}</div>
        }
        {chat && chat.map((item, n) =>(
          <div key={idGenerator(80)}>
            {isAuth && item.autor.id === isAuth.uid &&
              <div key={idGenerator(70)} className="messageCard mset flex_e">
                <div className="messages">
                  {item.messages.map(message=>(
                    <div onDoubleClick={()=>handleATop(message)} key={message.id} className={`msgbody ${states.index === message.id && "m_selected"}`}>
                      {message.images !== "" &&
                        <div onClick={()=>setImages(message.images.images)} className="message_images flex_wrap">
                          {message.images.images.slice(0,MAX_DISPLAY).map((img,h)=>(
                            <div key={idGenerator(7)} className="message_image_wrap">
                              <img src={img} className="message_image"/>
                              {h===4 && message.images.length > MAX_DISPLAY &&(
                              <div className="message_hidden-images flex_c_c">
                                {`+${message.images.length - MAX_DISPLAY}`}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      }
                      {message.text.split("\n").map((text, i) =>(
                        <MessageLine key={i} text={text} />
                      ))}
                      <div className="tempo flex_c_c"><span>{formatDate(item.time, language).timeAgo}</span><svg fill="#4fc3f7" baseProfile="full" width="18" viewBox="0 0 24.00 24.00"><path fill={item.seen &&  "#4fc3f7" || "#fff"} d="M.413 13.412L6 18.998l1.413-1.414-5.586-5.586m20.415-6.414L11.656 16.17l-4.171-4.172-1.414 1.414 5.585 5.586 12-12m-5.656 0l-1.415-1.414-6.343 6.343 1.414 1.414L18 6.998z"/></svg></div>
                    </div>
                  ))}
                </div>
                <div className="a_msg_avatar">
                  <Avatar avatar={item.autor} color={color}/>
                </div>
              </div>
              ||
              <div key={idGenerator()} className="messageCard receved flex_s">
                <div className="a_msg_avatar">
                
              {datas && <Avatar avatar={item.autor} color={datas.chatColor}/>}
                </div>
                <div className="messages flex_e">
                  {item.messages.map((message)=>(
                    <div onDoubleClick={()=>handleATop(message)} key={message.id} className={`msgbody ${states.index === message.id && "m_selected"}`}>
                      {message.images !== ""  &&
                        <div onClick={()=>setImages(message.images.images)} className="message_images flex_wrap">
                          {message.images.images.slice(0, MAX_DISPLAY).map((img,j)=>(
                            <div key={idGenerator(8)} className="message_image_wrap">
                              <img src={img} className="message_image"/>
                              {j=== 4 && message.images.length > MAX_DISPLAY &&(
                              <div className="message_hidden-images flex_c_c">
                                {`+${message.images.length - MAX_DISPLAY}`}
                                </div>
                                )}
                            </div>
                          ))}
                        </div>
                      }
                      {message.text.split("\n").map((text, i) =>(
                        <MessageLine key={i} text={text} />
                      ))}
                      <div className="tempo"><span>{formatDate(item.time, language).timeAgo}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            }
          </div>
        ))}
        <div className="bottom " ref={bottom}></div>
      </div>

      <form onSubmit={handleSubmit} className="msger_box">
        <div onClick={()=>setStates(prevState=>({...prevState,actions:null,index:null}))} className="msger_box_wrap a_container">
          {values.images.length > 0 &&
            <div className="a_send_images flex_wrap">
              {values.images.slice(-maxDisplay).map((image, k) => (
                <div key={k} className="a_send_image_wrap">
                  <div className="a_send_image_card">
                    <img className="a_send_image" src={image} alt={`Imagem ${k + 1}`} />
                    <div onClick={() => deleteImage(k)} className="a_send_image_delete br60 flex_c_c">
                       <svg  fill="currentColor" opacity="1.0"  baseProfile="full" width="16" height="16" viewBox="0 0 24.00  24.00"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5   6.41 10.59  12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg> 
                    </div>
                    {k === 0 && values.images.length > maxDisplay && (
                      <div className="hidden-images-warning flex_c_c">
                        {`+${values.images.length - maxDisplay}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          }
          <div className="flex_b_c">
            <ImageCropper language={language} mode={"chat"}  handleSaveAvatar={handleSaveAvatar} fileName={fileName} setFileName={setFileName} clearFileName={clearFileName}/>
            <div className="chat_texter">
              <textarea ref={textarea} name="text" value={values.text} placeholder={texts.text[language]} rows="1" onChange={handleTextChange} onFocus={()=>onTyping(true)}></textarea>
            </div>
            {states.isLoading && <div></div> ||
            <button disabled={states.loading} className="sender_btn"> 
              {states.loading && <MinLoder/> || <svg fill="currentColor" opacity="1.0" baseProfile="full" width="25" height="25" viewBox="0 0 24.00 24.00"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z"/></svg>}
            </button>
            }
          </div>
        </div>
      </form>
      
    </div>
  );
}

const MessageLine = ({text}) => {
  const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
  const parts = text.split(linkRegex);
  return (
    <div className="a_msg_text">
      {parts.map((part, j) => {
        if (part.match(linkRegex)) {
          return (
            <a key={j} className="a_highlight" href={part.startsWith('http') ? part : `http://${part}`} target="_blank" rel="noopener noreferrer">
              {part}
            </a>
          );
        }
        return part;
      })}
    </div>
  );
};

const AutoMsg = ({language, owner, datas})=>{
  return( 
    <div>
      <div className="messageCard receved flex_s">
      <div className="a_msg_avatar">
        {owner && datas && <Avatar avatar={owner} color={datas.chatColor}/>}
      </div>
      <div className="messages flex_e">
        <div className={`msgbody`}>
          {"Olá!\nEm que podemos ti ajudar?".split("\n").map((text, i)=>(
           <p className="a_msg_text" key={i}>{text}</p>
          ))}
          <div className="tempo"><span>{formatDate(getCurrentTime().fullDate).timeAgo}</span></div>
        </div>
      </div>
      </div>
    </div>
  );
}

const FaqsForm =({language,type, props, handleToggle})=>{
  if(!type) return null;
  const isMounted = useRef(true);
  const text = useRef(null);
  const containHtml = /<|>|<[a-z][\s\S]*>/i;
  const [states, setStates] = useState({loading: false});
  const [error,setError]=useState({text: null,id:null, type: "", error:{text:null,stack:null}});
  const [values, setValues]=useState({text:"",id:`AR-${idGenerator(12)}`, type: type || "reply"});
  const formText = {
    label: {
      reply: "automaticReply",
      question: "automaticQuestion"
    },
    error:{
      reply: "invalidAutomaticReply",
      question: "invalidAutomaticQuestions"
    }
  } 
  const handleTextChange=(event)=>{
    const {name,value}=event.target;
    setValues(prevValue=>({...prevValue,[name]:value}));
    setError(prevError=>({...prevError,[name]:null}));
    event.target.style.height = 'auto';
    event.target.style.height = (event.target.scrollHeight) + 'px';
  }
  
  const handleSubmit=(event) => {
    event.preventDefault();
    const errors = [];
    if(values.text.length <= 0 || values.text.match(containHtml)){
      setError(prevError=>({...prevError,text: texts[formText.error[type]][language]}));
      errors.push(1);
    }
    if(!errors.length > 0){
      setStates(prevState=>({...prevState,loading:true}));
      dbFaqs.child(values.id)[props.action](values).then(()=>{
        setStates(prevState=>({...prevState,loading:false}));
        setValues(prevValue=>({...prevValue,text:""}));
        handleToggle();
      }).catch((error)=>{
        console.log(error);
        handleToggle();
      });
    }
  }
  
  useEffect(()=>{
    if(props && props.id && props.text){
      setValues(prevValue=>({...prevValue,id:props.id,text:props.text}));
    }
  },[props]);
  
  return(
    <div className="a_alert flex_c_c">
      <form onSubmit={handleSubmit} className="a_alert_container a_container ">
        <div className="a_alert_header">
        <h4>{texts.faqs[language]}</h4>
        </div>
        <div className="a_alert_body">
          <div className="input_card texter">
            <div className="input_wrap_textarea br6-a  flex_b_c">
              <textarea ref={text}  value={values.text} onChange={handleTextChange} className={chackeVal(values.text, "textarea input")} id="text" rows="1" name="text">{values.text}</textarea>
              <label htmlFor="text">{texts[formText.label[type]][language]}</label>
      </div>
      <div className="label_error">{error && error.text}</div>
    </div>
        </div>
        <div className="a_alert_btns flex_e_c">
          <div className="a_alert_btn_wrap">
            <button onClick={()=>handleToggle("reply")} type="button" className="a_alert_btn_cancel br6-a">{texts.cancel[language]}</button>
          </div>
            <div className="a_alert_btn_wrap">
            <button className="a_alert_btn_continue br6-a primary-btn">{states.loading && <MinLoder/> || texts.save[language]}</button>
          </div>
        </div> 
      </form>
    </div>
  
    )
}

const AutoFaqs = ({language,mode,type,onSend,handleReplyAction}) =>{
  if(!type) return null;
  const [alertDatas, setAlertDatas] = useState(null);
  const [datas,setDatas] = useState(null);
  const popUpText = {
    title: {
      reply: "automaticReplys",
      question: "automaticQuestions"
    }
  }
  useEffect(()=>{
    const handleItemsAdded = snapItem =>{
      const newDatas = [];
      if(snapItem.exists){
        snapItem.forEach((snapChatData)=>{
          newDatas.push(snapChatData.val());
          if(snapItem.numChildren()=== newDatas.length){
            setDatas(newDatas);
          }
        });
      }else{
        setDatas([]);
      }
    }
    if(type){
      dbFaqs.orderByChild("type").equalTo(type).on("child_changed", handleItemsAdded);
      dbFaqs.orderByChild("type").equalTo(type).on("value", handleItemsAdded);
    } 
    return ()=>{
      if(type){
        dbFaqs.orderByChild("type").equalTo(type).off("child_changed", handleItemsAdded);
        dbFaqs.orderByChild("type").equalTo(type).off("value", handleItemsAdded);
      }
    }
  },[type,alertDatas]);
  const handleClear = (e)=>{
    const alertData = {
      header:false,
      text: texts.confirmClearFAQ[language],
      dangerText: texts.cannotBeUndone[language],
      actions:{
        onOk:{
          action: e,
          title: texts.clearNow[language],
          type:"danger"
        }
      }
    }
    setAlertDatas(alertData);
  }// set new alert actions
  
  const handleCancel = () =>{
    setAlertDatas(null);
    setStates(prevState=>({...prevState,actions:null,index:null}));
  }// cansel alert eventListener
  const handleAction =(event)=>{
    if(event){
      dbFaqs.child(event).remove().then(()=>{
        setAlertDatas(null);
        setError(prevError=>({...prevError,error:{text:texts.faqClearedCuccessfully[language],stack:"success"}}));
      }).catch((error)=>{
        setAlertDatas(null);
        setError(prevError=>({...prevError,error:{text:error.message,stack:"error"}}));
      });
    }
  }
  
  return(
     <div className="popUp flex_c_c">
     <div className="card_popup a_container">
      <Alert language={language} alertDatas={alertDatas} onOk={(event)=>handleAction(event)} onCancel={handleCancel}/>
     
        <div className="modal_header flex_b_c">
          <h4>{texts[popUpText.title[type]][language]}</h4>
          <div className="flex_b_c"><svg onClick={()=>handleReplyAction()} className="a_close_popup" fill="currentColor" opacity="1.0" baseProfile="full" width="24" height="24" viewBox="0 0 24.00 24.00"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg></div>
        </div>
          <div className="modal_body">
          {mode ==="admin" && datas && datas.map(item=>(
           <div key={idGenerator(16)} className="padd15-a">
             <p>{item.text}</p>
            
            <div className="flex_e_c faqs_btns padd10-t">
              <button className="br6-a padd6-10 transparent-btn-br" onClick={()=>handleReplyAction(type, "update", item)}>Editar</button>
              <button className="br6-a padd6-10 danger-btn" onClick={()=>handleClear(item.id)}>Deletar</button>
              <button className="br6-a padd6-10 primary-btn" onClick={()=>handleReplyAction(type, "send", item)}>Enviar</button>
            </div>
          </div>
          ))}
          {mode === "cabinet" && datas && datas.map(item=>(
           <div key={idGenerator(16)} onClick={()=>handleReplyAction(type, "send", item)} className="padd15-a flex_b_c">
             <p>{item.text}</p>
              <div className="br60 btn_circle flex_c_c">
                <i className="bi bi-chevron-right"></i>
              </div>
            </div>
          ))}
        </div>
        </div>
        </div>
  );
}

export default Chat;