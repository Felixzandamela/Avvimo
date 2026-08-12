const {Actions, db} = require('./action');
const {sendEmail} = require('./sendEmail');
const setTemplate = function(text, user) {
  let template = {
    title: [],
    links: [],
    paragraphs: [],
  };
  const lines = text.split("\r\n");
  lines.forEach(line => {
    if (/\{name\}/gi.test(line)) {
      const lineReplaced = line.replace(/\{name\}/gi, `${user?.name.split(" ")[0]}!`);
      template.title.push(lineReplaced);
    }else{
      const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
      const parts = line.split(linkRegex);
      parts.forEach((part) => {
        if(part.match(linkRegex)){
          template.links.push(part);
        }else if(part !== ""){
          template.paragraphs.push(part);
        }
      });
    }
  });
  return template;
}

module.exports.emailQueueSender = async function(_id){
  const query = _id? { _id: _id} : null;
   const emails_Queue = await Actions.get("emailsQueue", query);
   if(emails_Queue){
     const {_id, _ids, subject, text} = emails_Queue[0];
     if(_ids.length === 0){
       const datas ={collection: "emailsQueue"};
       const deleteEmailsQueue = await Actions.delete(_id.toString(), datas);
       console.warn(deleteEmailsQueue);
     }
     const idsSliced = _ids.slice(0,10);
     const users = await Actions.get("users", {_id: {$in: idsSliced}});
     const emailPromises = [];
     if(users) {
       for (let k = 0; k < users.length; k++) {
         const user = users[k];
         let currentUserToEmail = {
           innerHtml: setTemplate(text, user),
           subject: subject,
           name: user.name,
           email: user.email
         }
         emailPromises.push(sendEmail(currentUserToEmail, "customized"));
       }
       await Promise.all(emailPromises);
       await db.emailsQueue.findByIdAndUpdate(_id, {$pull: { _ids: { $in: idsSliced }}, new: true });
       console.warn(`${idsSliced} deleted to email queue`);
     }
   }
 }