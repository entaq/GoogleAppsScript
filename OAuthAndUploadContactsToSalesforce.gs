function onInstall(){
  onOpen();
}

function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menuEntries = [ {name: "Upload to SalesForce", functionName: "salesforceEntryPoint"}];
  ss.addMenu("Salesforce.com", menuEntries);
}

function salesforceEntryPoint(){
  if(isTokenValid()){
    HTMLToOutput = '<html><h1>Already have token</h1></html>';
    //HTMLToOutput += getData();
    HTMLToOutput += uploadData();
  }
  else {//we are starting from scratch or resetting
    HTMLToOutput = "<html><h1>You need to login</h1><a href='"+getURLForAuthorization()+"'>click here to start</a><br>Re-open this window when you return.</html>";
  }
  SpreadsheetApp.getActiveSpreadsheet().show(HtmlService.createHtmlOutput(HTMLToOutput));
}

function doGet(e) {
  var HTMLToOutput;
  if(e.parameters.code){//if we get "code" as a parameter in, then this is a callback. we can make this more explicit
    getAndStoreAccessToken(e.parameters.code);
    HTMLToOutput = '<html><h1>Finished with oAuth</h1>You can close this window.</html>';
  }
  return HtmlService.createHtmlOutput(HTMLToOutput);
}

//do meaningful salesforce access here
function getData(){
  return runSOQL('SELECT+name+from+Account');
}

function runSOQL(soql){
  var getDataURL = UserProperties.getProperty(baseURLPropertyName) + '/services/data/v26.0/query/?q='+soql;
  var dataResponse = UrlFetchApp.fetch(getDataURL,getUrlFetchOptions()).getContentText();  
  return dataResponse;
}

function uploadData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var contactDataRange = ss.getDataRange();
  var contactObjects = getRowsData(sheet, contactDataRange,1);
  var runningLog = '<br>Uploaded following:<br><br>';
  for(var i = 1;i<contactObjects.length;i++){
    var payload =  Utilities.jsonStringify(
      {"FirstName" : contactObjects[i].firstname,
       "LastName" : contactObjects[i].lastname,
       "Email" : contactObjects[i].email,
       "Phone" : contactObjects[i].phone
      }
    );
    Logger.log('trying ' + payload);
    var getDataURL = UserProperties.getProperty(baseURLPropertyName) + '/services/data/v26.0/sobjects/Contact/';
    runningLog += UrlFetchApp.fetch(getDataURL,getUrlFetchPOSTOptions(payload)).getContentText() + '<br>';  
  }
  return runningLog;
}

////oAuth related code

//hardcoded here for easily tweaking this. should move this to ScriptProperties or better parameterize them
//step 1. we can actually start directly here if that is necessary
var AUTHORIZE_URL = 'https://login.salesforce.com/services/oauth2/authorize'; 
//step 2. after we get the callback, go get token
var TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token'; 

//PUT YOUR OWN SETTINGS HERE
var CLIENT_ID = '3MVG9y6x0357HlefXsMa7Fg0tYH0SLtBZwLWyhSP4hBGExVuUjoWLJ8rfZ1jyyw0ZRQt7H28rByHHJjRQlqMs';
var CLIENT_SECRET='SECRET_HERE';
var REDIRECT_URL= ScriptApp.getService().getUrl();

//this is the user propety where we'll store the token, make sure this is unique across all user properties across all scripts
var tokenPropertyName = 'SALESFORCE_OAUTH_TOKEN'; 
var baseURLPropertyName = 'SALESFORCE_INSTANCE_URL'; 


//this is the URL where they'll authorize with salesforce.com
//may need to add a "scope" param here. like &scope=full for salesforce
function getURLForAuthorization(){
  return AUTHORIZE_URL + '?response_type=code&client_id='+CLIENT_ID+'&redirect_uri='+REDIRECT_URL
}

function getAndStoreAccessToken(code){
  var nextURL = TOKEN_URL + '?client_id='+CLIENT_ID+'&client_secret='+CLIENT_SECRET+'&grant_type=authorization_code&redirect_uri='+REDIRECT_URL+'&code=' + code;
  
  var response = UrlFetchApp.fetch(nextURL).getContentText();   
  var tokenResponse = JSON.parse(response);
  
  //salesforce requires you to call against the instance URL that is against the token (eg. https://na9.salesforce.com/)
  UserProperties.setProperty(baseURLPropertyName, tokenResponse.instance_url);
  //store the token for later retrival
  UserProperties.setProperty(tokenPropertyName, tokenResponse.access_token);
}


function getUrlFetchOptions() {
  var token = UserProperties.getProperty(tokenPropertyName);
  return {
    "contentType" : "application/json",
    "headers" : {
      "Authorization" : "Bearer " + token,
      "Accept" : "application/json"
    }
  };
}



function getUrlFetchPOSTOptions(payload){
  var token = UserProperties.getProperty(tokenPropertyName);
  return {
    "method": "post",
    "contentType" : "application/json",
    "payload" : payload,
    "headers" : {
      "Authorization" : "Bearer " + token
    }
  }
}

function isTokenValid() {
  var token = UserProperties.getProperty(tokenPropertyName);
  if(!token){ //if its empty or undefined
    return false;
  }
  return true; //naive check
}