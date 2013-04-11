var db = ScriptDb.getMyDb();

function getDb(){
  return db;
}

function sendGCM(msg){
  msg = msg ||  'hello world!'; //give default message for debugging
  
  var regIds  = [];
  var result = db.query({});
  while (result.hasNext()) {
    var current = result.next();
    regIds.push(current.regId);
  }
  
  var apiKey = 'YOUR_API_KEY';
  
  var payload = {'registration_ids' : regIds,
                 'data' : {
                   'message' : msg
                 }};
  var urlFetchOptions =  {'contentType' : 'application/json',
                          'headers' : {'Authorization' : 'key=' + apiKey},
                          'method' : 'post',
                          'payload' : JSON.stringify(payload)};
  
  var gcmUrl = 'https://android.googleapis.com/gcm/send';
  var response = UrlFetchApp.fetch(gcmUrl,urlFetchOptions).getContentText()
  
  Logger.log(response);//for testing purposes. improve error handling here
}