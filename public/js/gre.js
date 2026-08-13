const $ = document.querySelectorAll.bind(document);
const avvimo =  Avvimo();

function check(input, type, index){
  if(!input && !/^(phoneNumber|upline|stars)$/i.test(type)){ return {msg:"Este campo não pode estar vazio",index:index}}
  switch(type){
    case "email":
      return !input.match(/^[a-zA-Z][a-zA-Z0-9\-\_\.]+@[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}$/) ? {msg: "E-mail inválido!", index:index} : null;
      break;
    case "name" || "username" :
      return input.length < 3 || /^\d+$/.test(input) || /^[a-zA-Z][a-zA-Z0-9\-\_\.]+@[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}$/.test(input) ? {msg: "O nome inválido.",index:index} : null;
      break;
    case "newpassword":
      let invalid = !input.match(/[A-Za-z]/) ||  !input.match(/[0-9]/) || input.length < 5 ? true : false
      return invalid ? {msg:"A senha deve ter pelo menos 6 caracteres, 2 letras maiúsculas e 2 números.", index: index} : null;
    break;
    case "maturity":
      return parseFloat(input) <= 0 ? {msg:"Dias de vencimento inválido", index:index} : null;
    break;
    case "percentage":
      return parseFloat(input) <= 0 ?  {msg: "Percentagem inválido" , index:index} : null;
    break;
    case "min":
      return  parseFloat(input) <= 0 ? {msg:"Valor minímo inválido",index:index} : null;
    break;
    case "max":
      return  parseFloat(input) <= 0 ? {msg: "Valor maxímo inválido", index:index} : null;
    break;
    case "text":
      return input.length < 50 || input.length > 500 ? {msg:"O texto não pode ter menos de 50 ou mais de 500 caracteres!", index:index}: null;
    break;
    case "vcode":
      return input.length !== 6 ? {msg:"O código deve ter 6 digítos", index:index} : null;
    break;
    case "dates":
      return !/^(0|[1-9]|10|11)\s(0[1-9]|[12][0-9]|3[01])(-(0[1-9]|[12][0-9]|3[01]))?$/.test(input)? {msg:"Data inválido", index: index} : null;
    break;
    default: 
    return null;
  }
}

const submitBtn  = document.querySelector("#submitBtn");
submitBtn.addEventListener("click",()=>{
 const fields = [...$(".input")];
 const empty = [], doubleA = [], doubleB = [];
  for(let k in fields){
    if(fields[k].type === "hidden"){continue;
    }else{
      const field = fields[k].type == "email" ? fields[k].type : fields[k].name;
      if(check(fields[k].value, field, k)){
        empty.push(check(fields[k].value, field, k));
      }else if(fields[k].name == "accounts"){
        if(!fields[k].accessKey){
          empty.push({msg:"Selecione um metódo de pagamento", index: k});
        }else if(/^(Vodacom|Mpesa|M-pesa|mpesa|m-pesa)$/i.test(fields[k].accessKey) && !fields[k].value.match(/^8[45]\d{7}$/) || /^(E-mola|Emola|Movitel|emola|eMola|e-mola)$/i.test(fields[k].accessKey) && !fields[k].value.match(/^8[67]\d{7}$/) || /^(Mkesh|M-kesh|mkesh|mKesh|m-kesh|Tmcel)$/i.test(fields[k].accessKey) && !fields[k].value.match(/^8[23]\d{7}$/) || /^(Ponto24|Simo)$/i.test(fields[k].accessKey) && !fields[k].value.match(/^8[234567]\d{7}$/)){
          empty.push({msg:`Conta ${fields[k].accessKey.toLowerCase()} inválido`, index: k});
        }else if(fields[k].title == "withdraw"){
          if(document.querySelectorAll(".hasMadeDeposits")){
            const hasMadeDeposits = [...document.querySelectorAll(".hasMadeDeposits")];
            const hasDeposited = hasMadeDeposits.filter((element)=>{
              if(element.value == fields[k].value){return true}
            });
            if(!hasDeposited || hasDeposited.length === 0){
              empty.push({msg: "Digíta uma conta que você já usou para deposítar!", index:k});
            }
          }
        }
      }else if(fields[k].name == "amounts"){
        if(parseFloat(fields[k].value) > parseFloat(fields[k].max)){
          empty.push({msg:`O valor excedeu o limite maxímo de ${fields[k].max}`, index:k});
        }else if(parseFloat(fields[k].value) < parseFloat(fields[k].min)){
          empty.push({msg:`O valor minímo é de ${fields[k].min}`, index:k});
        }
      }else if(fields[k].name == "phoneNumber"){
        if(fields[k].value && !fields[k].value.match(/^8[234567]\d{7}$/)){
          empty.push({msg:`Número de telefone inválido!`, index:k});
        }
      }else if(fields[k].name == "stars"){
        if(!fields[k].value){
          shakeStars();
          empty.push({msg:``, index:k});
        }
      }else if(fields[k].value.match(/<|>|<[a-z][\s\S]*>/i)){
        empty.push({msg:"Tags html não são permitidos", index:k});
      }
      if(fields[k].id == "passwordA")doubleA.push(fields[k], k);
      if(fields[k].id == "passwordB")doubleB.push(fields[k], k);
    }
 }
  if(doubleA.length > 0){
    if(doubleB[0].value != doubleA[0].value){
      empty.push({
        msg: "A senha não corresponde.",
        index:doubleB[1]
      });
    }
  }
  
  const digits = [];
  if($(".digit").length > 0){
    $(".digit").forEach((element,i) =>{
      if(!element.value){
        element.style.borderColor = "red";
        digits.push(i);
      }
    });
  }
  if(digits.length > 0){
    empty.push({msg:"O código deve ter 6 digítos", index:0})
  }
 
  for(let y in empty){
    if(empty[y]){
      avvimo.setContent($(".label_error")[empty[y].index], empty[y].msg);
    }
  }
  if(empty.length === 0){submitForm();}  
});
function shakeStars(){
  const t_stars = document.getElementById("t_stars");
  t_stars.classList.add("shakes");
  setTimeout(()=>{
    t_stars.classList.remove("shakes");
  },500);
}

avvimo.addListener($(".input"), "focus", function(event, index){
  avvimo.setContent($(".label_error")[index], "");
});

try{
  if($(".password_eye").length > 0){
    avvimo.addListener($(".password_eye")[0], "click", function(event, index){
      let inputType = $(".password")[0].type === "password";
      avvimo.setAttributes($(".password"), {type: !inputType ? "password" : "text"});
      avvimo.setClass($("#toggleEye")[0],  !inputType ? "bi bi-eye": "bi bi-eye-slash");
    });
  }
}catch(error){};

try{
  if(document.querySelectorAll(".checkboxs")){
    const checkboxs = [...document.querySelectorAll(".checkboxs")];
    
    checkboxs.forEach((checkbox, key)=>{
      checkbox.addEventListener("change",()=>{
        checkbox.value = checkbox.checked? "true" : "false";
        document.getElementById(checkbox.accessKey).value = checkbox.checked ? "true" : "false";
      });
      checkbox.checked = checkbox.value == "true" ? true : false; 
    });
  }
}catch(error){};

try{
  if(document.querySelectorAll(".usedAccount")){
    const usedAccounts = [...document.querySelectorAll(".usedAccount")];
    usedAccounts.forEach((num)=>{
      num.addEventListener("click",()=>{
        const datas = JSON.parse(num.accessKey);
        const checkbox = document.getElementById(datas._id).checked = true;
        document.getElementById("gateway").value = datas._id;
        const accounts = document.getElementById("accounts");
        accounts.value = datas.account;
        accounts.accessKey = datas.name;
        document.getElementById("account").value = datas.account;
      })
    });
  }
}catch(error){};

try{
  if(document.querySelectorAll(".accountType")){
    const accountType = [...document.querySelectorAll(".accountType")];
    accountType.forEach((num)=>{
      num.addEventListener("click",()=>{
        document.getElementById("account").type = num.accessKey;
      });
    });
  }
}catch(error){};

try{
  const  emojisExpressions = ["bi bi-emoji-neutral", "bi bi-emoji-frown", "bi bi-emoji-expressionless", "bi bi-emoji-smile", "bi bi-emoji-heart-eyes"];
  const colorsArray = ["red","orange", "lightblue","lightgreen","gold"];
  if(document.querySelector(".new_star")){
    const new_stars = [...document.querySelectorAll(".new_star")];
    const stars = document.getElementById("stars");
    const init = parseInt(stars.value);
    if(init > 0){updateRating(init - 1);}
     new_stars.forEach((star,index)=>{
      star.addEventListener("click", ()=>updateRating(index))
    });
    function updateRating(i){
      new_stars.forEach((star, idx)=>{
        if(idx < i + 1){
          stars.value = idx + 1;
          star.classList.add("active");
        }else{
          star.classList.remove("active");
        }
      });
      const emoji = document.getElementById("emoji");
      emoji.setAttribute("class" , emojisExpressions[i]);
      emoji.style.color = colorsArray[i];
    }
  }
  
  if(document.querySelector(".reviewText")){
    const textarea = document.querySelector(".reviewText");
    const reviewLimitText = document.getElementById("reviewLimitText");
    if(textarea.value.length > 1){
       textarea.style.height = (textarea.scrollHeight) + "px"
    }
    textarea.addEventListener("input",()=>{
    const {name,value}= textarea;
    if(reviewLimitText){reviewLimitText.textContent = `${value.length}/500`;}
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
  });
  }
  
}catch(error){console.error(alert(error))};

try{
  if($(".selectEmailers").length > 0){
    avvimo.addListener($(".selectEmailers"), "click", function(event){
      const target = event.target || event.currentTarget;
      const {id, accessKey, textContent} = target;
      $("#acname")[0].value = id;
      $("#acvalue")[0].value = accessKey;
      $("#prevalue")[0].value = textContent;
    });
  }
  
  // Para o input event
  if($("#prevalue").length > 0){
    avvimo.addListener($("#prevalue")[0], "input", function(event){
      const {value} = event.target;
      const emails = value && value.split(",");
      const values = [];
      for(let e = 0; e < emails.length; e++){
        if(emails[e].trim().match(/^[a-zA-Z][a-zA-Z0-9\-\_\.]+@[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}$/) && !values.includes(emails[e])){
          values.push(emails[e].trim());
        }
      }
      if(values.length > 0){
        $("#acname")[0].value = "email";
        $("#acvalue")[0].value = values.join(',');
      }
    });
  }
}catch(error){console.log(error)};

try{
  if(document.querySelectorAll(".digit")){
    const inputs = document.querySelectorAll(".digit");
    inputs.forEach((input, i) => {
      input.addEventListener("input", () => {
        // Só aceita número
        input.value = input.value.replace(/\D/g, "");
        if(input.value.length > 1){
          for(let b = 0;b < input.value.length; b++){
            input.value = input.value[b+1];
          }
        }
        // Pula pro próximo
        if(input.value && i < inputs.length - 1) {
          inputs[i + 1].focus();
        }
        setCode();
      });
      // Apagar volta pro anterior
      input.addEventListener("keydown", (e) => {
        if(e.key === "Backspace" && !input.value && i > 0) {
          inputs[i - 1].focus();
        }
      });
      input.addEventListener("paste", (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0,6);
        pasteData.split("").forEach((char, idx) => {
          if(inputs[idx]) inputs[idx].value = char;
          inputs[idx].focus();
          setCode();
        });
      });
    });
    // Pra pegar o código completo:
    function setCode() {
      let code = Array.from(inputs).map(input => input.value).join("");
      avvimo.setAttributes($("#vcode")[0], {value: code});
      if(code.length === 6){
        setTimeout(()=>submitForm(),200);
      }
    }
  }
  avvimo.addListener($(".digit"), "focus", function(event, index){
    event.target.style.borderColor = "var(--border)";
    avvimo.setContent($(".label_error")[0], "");
  });

}catch(error){console.log(error)}

function submitForm(){
  avvimo.setStyle($("#min_loader")[0], {display: "flex"});
  avvimo.setStyle($("#btnText")[0], {display : "none"});
  avvimo.setAttributes($('#submitBtn')[0], {disabled: true});
  $('#form')[0].submit();
}