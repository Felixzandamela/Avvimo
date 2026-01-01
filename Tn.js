const g = ["admin","cabinet"]
const account = g.filter((item)=>{
  return item === "admin"
})
console.log("admin" === g["admin"])