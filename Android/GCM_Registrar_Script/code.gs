function doGet() {
  return HtmlService.createHtmlOutputFromFile('ui');
}


//import shared db library
//used the shared version intead of - 
//ScriptDb.getMyDb()
var db = SharedDb.getDb();

function doPost(e) {
  if(e.parameter.regId){
    var reg = db.query({regId : e.parameter.regId}).next();
    if(reg && e.parameter.type === 'unregister'){
      db.remove(reg);
    }
    else if(!reg && e.parameter.type === 'register'){
      db.save(e.parameter);
    }
  }
}
