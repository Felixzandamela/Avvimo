
let fleets =[
  {total:10,
    id:"23"
  },
  {total:100,
  id:"45"
  },
  {total:450,id:"242"},
  {total:0,id:"4"}]
  
  const popular = fleets.reduce((great, current) => current.total > great.total ? current : great, fleets[0]);
  console.log(popular)
  for(let i in fleets){
    if(fleets[i].id !== popular.id){
      fleets[i].distack = false;
    }else{
      fleets[i].distack = true
    }
  }
  console.log(fleets)
  
  const checkConnection = function() {
    const online = window.navigator.onLine;
    if (!online) {
      return "Sem Conexão";
    } else {
      const connection = window.navigator.connection;
      if (connection && connection.downlink !== undefined) {
        if (connection.downlink < 1 ) {
          return "Conexão lenta";
        } else {
          return null
        }
      } else {
        return null;
      }
    }
  }

window.addEventListener("offline", checkConnection);
window.addEventListener("online", checkConnection);

if (window.navigator.connection) {
    window.navigator.connection.addEventListener("change", checkConnection);
}

checkConnection();
