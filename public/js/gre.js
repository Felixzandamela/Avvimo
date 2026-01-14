function check(input, type, index){
  if(!input && !/^(phoneNumber|upline|stars)$/i.test(type)){ return {msg:"Este campo não pode estar vazio",index:index}}
  switch(type){
    case "email":
      return !input.match(/^[a-zA-Z][a-zA-Z0-9\-\_\.]+@[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}$/) ? {msg: "E-mail inválido!", index:index} : null;
      break;
    case "name" || "username" :
      return input.length < 3 ? {msg: "O nome deve ter pelo menos mais de 3 caracteres.",index:index} : null;
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
      return input.length < 50 || input.length > 500 ? {msg:"A texto não pode der menos de 50 ou mais de 500 caracteres!", index:index}: null;
    break;
    
    default: 
    return null;
  }

}

const submitBtn  = document.querySelector("#submitBtn");
submitBtn.addEventListener("click",()=>{
 const fields = [...document.querySelectorAll(".input")]
 const errors = [...document.querySelectorAll(".label_error")]
 const empty = [], doubleA = [], doubleB = [];
  for(let k in fields){
    if(fields[k].type == "hidden"){continue;
    }else{
      const field = fields[k].type == "email" ? fields[k].type : fields[k].name;
      if(check(fields[k].value, field, k)){
        empty.push(check(fields[k].value, field, k));
      }else if(fields[k].name == "accounts"){
        if(!fields[k].accessKey){
          empty.push({msg:"Selecione um metódo de pagamento", index: k});
        }else if(/^(Vodacom|Mpesa|M-pesa)$/i.test(fields[k].accessKey) && !fields[k].value.match(/^8[45]\d{7}$/) || /^(E-mola|Emola|Movitel)$/i.test(fields[k].accessKey) && !fields[k].value.match(/^8[67]\d{7}$/) || /^(Mcash|M-cash|Tmcel)$/i.test(fields[k].accessKey) && !fields[k].value.match(/^8[23]\d{7}$/) || /^(Ponto24|Simo)$/i.test(fields[k].accessKey) && !fields[k].value.match(/^8[234567]\d{7}$/)){
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
  for(let y in empty){
    if(empty[y]){
      errors[empty[y].index].innerHTML = empty[y].msg;
    }
  }
  if(empty.length === 0){
    document.getElementById("min_loader").style.display = "flex";
    document.getElementById("btnText").style.display = "none";
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('form').submit();
 }  
});
function shakeStars(){
  const t_stars = document.getElementById("t_stars");
  t_stars.classList.add("shakes");
  setTimeout(()=>{
    t_stars.classList.remove("shakes");
  },500);
}

var inputs = document.querySelectorAll(".input");
var errors = document.querySelectorAll(".label_error");
inputs.forEach((input, key)=>{
  input.addEventListener("focus", ()=>{
    errors[key].textContent = "";
  });
});

try{
  let inputType = false;
  if(document.querySelector(".password_eye")){
    const passwordEye = document.querySelector(".password_eye");
    passwordEye.addEventListener("click", () =>{
      let togglePasswords = document.querySelectorAll('.password');
      let pToggle = document.querySelector('#toggleEye');
      inputType = !inputType;
      togglePasswords.forEach(password=>{ password.setAttribute("type",  !inputType ? "password" : "text") });
      pToggle.classList = !inputType ? "bi bi-eye": "bi bi-eye-slash";
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
        document.getElementById("accounts").value = num.accessKey;
        document.getElementById("account").value = num.accessKey;
      })
    });
  }
}catch(error){};

try{
  const  emojisExpressions = ["bi bi-emoji-neutral", "bi bi-emoji-frown", "bi bi-emoji-expressionless", "bi bi-emoji-smile", "bi bi-emoji-heart-eyes"];
  const colorsArray = ["red","orange", "lightblue","lightgreen","gold"];
  if(document.querySelectorAll(".star")){
    const star = [...document.querySelectorAll(".new_star")];
    const stars = document.getElementById("stars");
    const init = parseInt(stars.value);
    if(init > 0){updateRating(init - 1);}
     star.forEach((star,index)=>{
      star.addEventListener("click", ()=>updateRating(index))
    });
    function updateRating(i){
      star.forEach((star, idx)=>{
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
    textarea.addEventListener("input",()=>{
    const {name,value}= textarea;
    if(value.length >= 20){
    }
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
  })
  }
  
}catch(error){console.error(error)};