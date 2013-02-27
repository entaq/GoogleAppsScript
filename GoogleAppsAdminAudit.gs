function doGet(e) {
  var HTMLToOutput;
  if(e.parameters.code){//if we get "code" as a parameter in, then this is a callback. we can make this more explicit
    getAndStoreAccessToken(e.parameters.code);
    HTMLToOutput = '<html><h1>Finished with oAuth</h1></html>';
  }
  else if(isTokenValid()){//if we already have a valid token, go off and start working with data
    HTMLToOutput = '<html><h1>Already have token</h1></html>';
  }
  else {//we are starting from scratch or resetting
    return HtmlService.createHtmlOutput("<html><h1>Lets start with oAuth</h1><a href='"+getURLForAuthorization()+"'>click here to start</a></html>");
  }
  
  HTMLToOutput += getData();
  return HtmlService.createHtmlOutput(HTMLToOutput);
}

//see docs here - https://developers.google.com/google-apps/admin-audit/
function getData(){
  var getCustomerIdUrl = 'https://apps-apis.google.com/a/feeds/customer/2.0/customerId?alt=json';
  var getCustomeerIdData = UrlFetchApp.fetch(getCustomerIdUrl,getUrlFetchOptions()).getContentText();  
  
  var responseObject = JSON.parse(getCustomeerIdData);
  
   //customerId is the 2nd item. make this more robust!
  var customerId = responseObject.entry.apps$property[1].value;
  
  //cpanel app ID is always the same. 
  var activityUrl = 'https://www.googleapis.com/apps/reporting/audit/v1/'+customerId+'/207535951991'; 
  var dataResponse = UrlFetchApp.fetch(activityUrl,getUrlFetchOptions()).getContentText();  
  
  var dataObject = JSON.parse(dataResponse);
  var ss = SpreadsheetApp.create('Audit Log');
  for(var i = 0;i<dataObject.items.length;i++){
    var row = [];
    var item = dataObject.items[i];
    if(item.actor){
      row.push(item.actor.callerType); 
      row.push(item.actor.email);
    }
    for(var j=0;item.events&&j<item.events.length;j++){
      row.push(item.events[j].eventType);
      row.push(item.events[j].name);
    } 
    if(item.id){
      row.push(item.id.time);
    }
    row.push(item.ipAddress);
    ss.appendRow(row);
  }
  SpreadsheetApp.flush();
  return "<a href='"+ss.getUrl()+"'>Open Spreadsheet here</a>";
}

//hardcoded here for easily tweaking this. should move this to ScriptProperties or better parameterize them
var AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/auth'; //step 1. we can actually start directly here if that is necessary
var TOKEN_URL = 'https://accounts.google.com/o/oauth2/token'; //step 2. after we get the callback, go get token

var CLIENT_ID = 'YOUR_CLIENT_ID';
var CLIENT_SECRET = 'YOUR_CLIENT_SECRET';

var REDIRECT_URL= 'YOUR_DEPLOYED_URL';//safer than ScriptApp.getService().getUrl() for domain accounts

//this is the user propety where we'll store the token, make sure this is unique across all user properties across all scripts
var tokenPropertyName = 'GOOGLE_OAUTH_TOKEN'; 
var baseURLPropertyName = 'GOOGLE_INSTANCE_URL'; 

function getURLForAuthorization(){
  return AUTHORIZE_URL + '?response_type=code&client_id='+CLIENT_ID+'&redirect_uri='+REDIRECT_URL +
    '&scope=https://apps-apis.google.com/a/feeds/policies/ https://www.googleapis.com/auth/apps/reporting/audit.readonly&state=/profile';  
}

//Google requires POST, salesforce and slc worked with GET
function getAndStoreAccessToken(code){
  var parameters = {
    method : 'post',
    payload : 'client_id='+CLIENT_ID+'&client_secret='+CLIENT_SECRET+'&grant_type=authorization_code&redirect_uri='+REDIRECT_URL+'&code=' + code
  };
  
  var response = UrlFetchApp.fetch(TOKEN_URL,parameters).getContentText();   
  var tokenResponse = JSON.parse(response);
  
  //store the token for later retrival
  UserProperties.setProperty(tokenPropertyName, tokenResponse.access_token);
}

//this may need to get tweaked per the API you are working with. 
//for instance, SLC had content type of application/vnd.slc+json. SLC also allows lower case 'bearer'
function getUrlFetchOptions() {
  var token = UserProperties.getProperty(tokenPropertyName);
  return {"contentType" : "application/json",
          "headers" : {"Authorization" : "Bearer " + token,
                       "Accept" : "application/json"}
         };
}

//naive check, add checking freshness or refreshing oauth tokens. also needs logout
function isTokenValid() {
  var token = UserProperties.getProperty(tokenPropertyName);
  if(!token){ //if its empty or undefined
    return false;
  }
  return true; 
}