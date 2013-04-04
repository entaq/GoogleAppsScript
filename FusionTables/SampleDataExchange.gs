function onInstall(){
  onOpen();
}

var ss = SpreadsheetApp.getActiveSpreadsheet();

function onOpen() {
  var menuEntries = [{name: "Login", functionName: "login"},
                     {name: "Download from Fusion Tables", functionName: "downloadFromFusionTables"},
                     {name: "Upload to Fusion Tables", functionName: "uploadToFusionTables"},
                     {name: "Reset credentials", functionName: "clearCreds"}];
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

function downloadFromFusionTables(){
  var schoolName = lookupSchoolName();
  
  var dataResponse = runSQL("select ROWID,StudentID,Subject,Grade,School from "+tableName+" where School = '"+schoolName+"'");
  var respObject = JSON.parse(dataResponse);
  ss.appendRow(respObject.columns);
  for(var i in respObject.rows){
    ss.appendRow(respObject.rows[i]);
  }
  ss.getActiveSheet().clearNotes();
}

function runSQL(sql){
  var getDataURL = 'https://www.googleapis.com/fusiontables/v1/query?sql='+sql;
  var dataResponse = UrlFetchApp.fetch(getDataURL,getUrlFetchOptions()).getContentText();  
  return dataResponse;
}

var tempEditedProperty = 'CURRENT_EDITED';

//simple tracker to see what changed. need to add more validation logic and safety checks here. 
function onEdit(e){   
  e.range.setComment("Edited at: " + new Date().toTimeString());
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
      runningLog += 'updating rowid = ' + rowObjects[i].rowid + ' with grade of ' + rowObjects[i].grade + '. ';
      runSQL("update "+tableName+" SET Grade = "+rowObjects[i].grade+" WHERE ROWID = '"+String(rowObjects[i].rowid)+"'");
    }
  }
  UserProperties.deleteProperty(tempEditedProperty);
  ss.getActiveSheet().clearNotes();
  if(runningLog){
    Browser.msgBox(runningLog);
  }
}

var AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/auth'; //step 1. we can actually start directly here if that is necessary
var TOKEN_URL = 'https://accounts.google.com/o/oauth2/token'; //step 2. after we get the callback, go get token


//PUT YOUR OWN SETTINGS HERE
var CLIENT_ID = 'YOUR_CLIENT_ID';
var CLIENT_SECRET='YOUR_CLIENT_SECRET';
var REDIRECT_URL= 'YOUR_REDIRECT_URL';

var tokenPropertyName = 'FUSIONTABLES_OAUTH_TOKEN'; 

function getURLForAuthorization(){
  return AUTHORIZE_URL + '?response_type=code&client_id='+CLIENT_ID+'&redirect_uri='+REDIRECT_URL +
    '&scope=https://www.googleapis.com/auth/fusiontables&state=/profile';  
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


function clearCreds(){
  UserProperties.deleteProperty(tokenPropertyName); 
  Browser.msgBox('Tokens cleared. Please login again from the menu before using Fusion tables');
}


 var schoolName = {
    "tom.principal@acmemiddleschool.edu":'Acme Middle School',
    "arun.at.pyxis@gmail.com":'Short Hills Prep',
    "arun.appsscript@gmail.com":'PK Middle School'
  }
var user = Session.getEffectiveUser().getEmail();

function lookupSchoolName(){
  return schoolName[user] || schoolName[0];
}

