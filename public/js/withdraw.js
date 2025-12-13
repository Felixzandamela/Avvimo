document.addEventListener("DOMContentLoaded", function (){
  const amounts = document.querySelector("#amounts");
  const accounts = document.querySelector("#accounts");
  const btnGateway = document.querySelectorAll(".btnGateway");
  console.log(accounts)
  class NewWithdraw{
    constructor(amount,account){
      this.amount =!amount? 0 : parseFloat(amount);
      this.fees =  Math.round(this.amount * (6 / 100));
      this.totalReceivable = (this.amount - this.fees).toFixed(2);
      this.account = account;
    }
  }
  const g = ()=>{
    const calcule = new NewWithdraw(amounts.value, accounts.value);
    document.getElementById("val").textContent = `${calcule.amount} Mt`;
    document.getElementById("amount").value = calcule.amount;
    document.getElementById("account").value = calcule.account;
    document.getElementById("fees").textContent = `${calcule.fees} Mt`;
    document.getElementById("totalReceivable").textContent = `${calcule.totalReceivable} Mt`;
  }
  g();
  amounts.addEventListener("input", g);
  accounts.addEventListener("input", g);
  btnGateway.forEach((btn)=>{
    btn.addEventListener("change", (btn)=>{
      accounts.accessKey = btn.target.accessKey;
      document.getElementById("gateway").value = btn.target.value;
    });
  });
});
     