function onInstall(){
  onOpen();
}

var ss = SpreadsheetApp.getActiveSpreadsheet();

function onOpen() {
  var menuEntries = [{name: "Login", functionName: "login"},
                     {name: "Download from Fusion Tables", functionName: "downloadFromFusionTables"},
                     {name: "Upload to Fusion Tables", functionName: "uploadToFusionTables"}];
  ss.addMenu("Fusion Tables", menuEntries);
}

function login(){
  if(isTokenValid()){
    HTMLToOutput = '<html><h1>Already have token</h1></html>';
  }
  else {//we are starting from scratch or resetting
    HTMLToOutput = "<html><h1>You need to login</h1><a href='"+getURLForAuthorization()+"'>click here to start</a><br>Re-open this window when you return.</html>";
  }
  ss.show(HtmlService.createHtmlOutput(HTMLToOutput));
}

function doGet(e) {
  var HTMLToOutput;
  if(e.parameters.code){//if we get "code" as a parameter in, then this is a callback. we can make this more explicit
    getAndStoreAccessToken(e.parameters.code);
    HTMLToOutput = '<html><h1>Finished with oAuth</h1>You can close this window.</html>';
  }
  return HtmlService.createHtmlOutput(HTMLToOutput);
}

var tableName = '1ETYzpkpTm4SfOMFTWHYgT9q1s4mSIE87yQCnQ04';

//do meaningful salesforce access here
function downloadFromFusionTables(){
  var dataResponse = runSQL("select+ROWID%2CStudentID%2CSubject%2CGrade%2CSchool+from+"+tableName+"+where+School+%3D+'Short+Hills+Prep'");
  var respObject = JSON.parse(dataResponse);
  ss.appendRow(respObject.columns);
  for(var i in respObject.rows){
    ss.appendRow(respObject.rows[i]);
  }
}

function runSQL(sql){
  var getDataURL = 'https://www.googleapis.com/fusiontables/v1/query?sql='+sql;
  var dataResponse = UrlFetchApp.fetch(getDataURL,getUrlFetchOptions()).getContentText();  
  return dataResponse;
}

var tempEditedProperty = 'CURRENT_EDITED';

function onEdit(e){   
  var rowid = ss.getActiveSheet().getRange(e.range.getRow(),1).getValue();
  var currentEditedItems = UserProperties.getProperty(tempEditedProperty)  || '';
  currentEditedItems += rowid+',';
  UserProperties.setProperty(tempEditedProperty,currentEditedItems);
}

function uploadToFusionTables() {
  var currentEditedItems = UserProperties.getProperty(tempEditedProperty)  || '';
  var rowIdsEdited = currentEditedItems.split(',');
  var rowObjects = getRowsData(ss.getActiveSheet(), ss.getDataRange(),1);
  var runningLog = '';
  for(var i = 1;i<rowObjects.length;i++){
    if(rowIdsEdited.indexOf(String(rowObjects[i].rowid))>-1){
      runningLog += 'updating rowid = ' + rowObjects[i].rowid + ' with grade of ' + rowObjects[i].grade + '\n';
      runSQL("update+"+tableName+"+SET+Grade%3D"+rowObjects[i].grade+"+WHERE+ROWID%3D'"+String(rowObjects[i].rowid)+"'");
    }
  }
  UserProperties.deleteProperty(tempEditedProperty);
  Browser.msgBox(runningLog);
}

var AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/auth'; //step 1. we can actually start directly here if that is necessary
var TOKEN_URL = 'https://accounts.google.com/o/oauth2/token'; //step 2. after we get the callback, go get token


//PUT YOUR OWN SETTINGS HERE
var CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
var CLIENT_SECRET='YOUR_SECRET_HERE';
var REDIRECT_URL= 'YOUR_CALLBACK_URL';

//this is the user propety where we'll store the token, make sure this is unique across all user properties across all scripts
var tokenPropertyName = 'FUSIONTABLES_OAUTH_TOKEN'; 
var baseURLPropertyName = 'FUSIONTABLES_INSTANCE_URL'; 

function getURLForAuthorization(){
  return AUTHORIZE_URL + '?response_type=code&client_id='+CLIENT_ID+'&redirect_uri='+REDIRECT_URL +
    '&scope=https://www.googleapis.com/auth/fusiontables&state=/fusion';  
}

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

function getUrlFetchOptions() {
  var token = UserProperties.getProperty(tokenPropertyName);
  return {
    "method" : "post",
    "contentType" : "application/json",
    "headers" : {
      "Authorization" : "Bearer " + token,
      "Accept" : "application/json"
    }
  };
}

// we don't have a logout option here. for now, manually clear out the token under File->Project->User Properties
function isTokenValid() {
  var token = UserProperties.getProperty(tokenPropertyName);
  if(!token){ //if its empty or undefined
    return false;
  }
  return true; //naive check
}