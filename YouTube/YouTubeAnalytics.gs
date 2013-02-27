/**
This is a spreadsheet bound script. 
4 menus will be added. The first two show case one demo and the second two the other. 
**/

//Import in Library ID = MGwgKN2Th03tJ5OdmlzB8KPxhMjh3Sh48
var _ = Underscore.load();
var API_KEY = 'YOU_API_KEY';

function onOpen() {
  SpreadsheetApp.getActive().addMenu('YouTube', [
    {name: 'Sync With Playlist', functionName: 'sync'},
    {name: 'Update Views', functionName: 'update'},
    {name: 'Do OAuth', functionName: 'getAuth'},
    {name: 'Load Analytics', functionName: 'getData'}
  ]);
}

//Original Author - Eric Koleda
function sync() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getActiveSheet();
  var existing = {};
  var data = sheet.getDataRange().getValues();
  var PLAYLIST_ID = Browser.inputBox('Please provide a playlist ID', 'Enter playlist ID here without quotes, eg - PLBC4C67EE5D2B46FB or EC3EF8DA2DEBF26B67', Browser.Buttons.OK);
  
  _.each(data, function(row) {
    existing[row[0]] = row;
  });
  var url = _.sprintf('https://www.googleapis.com/youtube/v3/playlistItems?key=%s&part=snippet&playlistId=%s&maxResults=50',
                      API_KEY, PLAYLIST_ID);
  var result = JSON.parse(UrlFetchApp.fetch(url).getContentText());
  _.each(result.items, function(item) {
    var id = item.snippet.resourceId.videoId;
    if (!existing[id]) {
      sheet.appendRow([id, new Date(item.snippet.publishedAt), item.snippet.title, 'http://www.youtube.com/watch?v=' + id])
    }
  });
  sheet.sort(2);
}

function update() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getActiveSheet();
  var views = [];
  var data = sheet.getDataRange().getValues();
  var ids = _.map(data, function(row) {
    return row[0];
  });
  var url = _.sprintf('https://www.googleapis.com/youtube/v3/videos?key=%s&part=statistics&id=%s',
                      API_KEY, ids.join(','));
  var result = JSON.parse(UrlFetchApp.fetch(url).getContentText());
  var viewCounts = {};
  _.each(result.items, function(item) {
    var id = item.id;
    viewCounts[id] = item.statistics.viewCount;
  });
  var views = [];
  _.each(data, function(row) {
    views.push([viewCounts[row[0]]]);
  });
  sheet.getRange(1, 5, views.length).setValues(views);
}


function getAuth() {
  var HTMLToOutput = '';
  if(isTokenValid()){//if we already have a valid token, go off and start working with data
    HTMLToOutput = '<html><h1>Already have token</h1></html>';
  }
  else {//we are starting from scratch or resetting
    HTMLToOutput = "<html><h1>Lets start with oAuth</h1><a href='"+getURLForAuthorization()+"'>click here to start</a></html>";
  }
  
  SpreadsheetApp.getActiveSpreadsheet().show(HtmlService.createHtmlOutput(HTMLToOutput));
}

function doGet(e) {
  var HTMLToOutput;
  if(e.parameters.code){//if we get "code" as a parameter in, then this is a callback. we can make this more explicit
    getAndStoreAccessToken(e.parameters.code);
    HTMLToOutput = '<html><h1>Finished with oAuth. You can close the window now</h1></html>';
  }
  
  else {//we are starting from scratch or resetting
    return HtmlService.createHtmlOutput("<html><h1>Lets start with oAuth</h1><a href='"+getURLForAuthorization()+"'>click here to start</a></html>");
  }
  
  return HtmlService.createHtmlOutput(HTMLToOutput);
}

/**
This assumes the first 6 rows of the active sheet is these two columns. 
ids - channel==UC_x5XG1OV2P6uZZ5FSM9Ttw
start-date - 2013-01-01
end-date - 2013-02-25
metrics - estimatedMinutesWatched
dimensions - 30DayTotals
filters - country==US
**/
function getData(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var ids	= ss.getActiveSheet().getRange(1, 2).getValue();
  var startdate	= ss.getActiveSheet().getRange(2, 2).getValue();
  var enddate	= ss.getActiveSheet().getRange(3, 2).getValue();
  var metrics	= ss.getActiveSheet().getRange(4, 2).getValue();
  var dimensions = ss.getActiveSheet().getRange(5, 2).getValue();
  var filters	= ss.getActiveSheet().getRange(6, 2).getValue();
  
  var base_url = 'https://www.googleapis.com/youtube/analytics/v1/reports?key='+API_KEY;
  var getDataURL = base_url + '&ids='+ids+'&start-date='+startdate+'&end-date='+enddate+'&metrics='+metrics+'&dimensions='+dimensions+'&filters='+filters;
  Logger.log(getDataURL);
  
  var dataResponse = UrlFetchApp.fetch(getDataURL,getUrlFetchOptions()).getContentText();  
  var dataObj = JSON.parse(dataResponse);
  var headers = [];
  for(var i = 0;dataObj.columnHeaders && i<dataObj.columnHeaders.length;i++){
    headers.push(dataObj.columnHeaders[i].name);
  }
  ss.appendRow(headers);
  for(var i = 0;dataObj.rows && i<dataObj.rows.length;i++){
    ss.appendRow(dataObj.rows[i]);
  }
  Logger.log(dataResponse)
  return dataResponse;
}


var AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/auth'; //step 1. we can actually start directly here if that is necessary
var TOKEN_URL = 'https://accounts.google.com/o/oauth2/token'; //step 2. after we get the callback, go get token

var CLIENT_ID = 'YOUR_CLIENT_ID';
var CLIENT_SECRET = 'YOUR_CLIENT_SECRET';

var REDIRECT_URL= ScriptApp.getService().getUrl();
var tokenPropertyName = 'GOOGLE_OAUTH_TOKEN'; 
var baseURLPropertyName = 'GOOGLE_INSTANCE_URL'; 


//this is the URL where they'll authorize with salesforce.com
//may need to add a "scope" param here. like &scope=full for salesforce
//example scope for google - https://www.googleapis.com/plus/v1/activities
function getURLForAuthorization(){
  return AUTHORIZE_URL + '?response_type=code&client_id='+CLIENT_ID+'&redirect_uri='+REDIRECT_URL +
    '&scope=https://www.googleapis.com/auth/yt-analytics.readonly&state=/profile';  
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
  
  //if your API has a more fancy token checking mechanism, use it. for now we just check to see if there is a token. 
  /*
  var responseString;
  try{
  responseString = UrlFetchApp.fetch(BASE_URI+'/api/rest/system/session/check',getUrlFetchOptions(token)).getContentText();
  }catch(e){ //presumably an HTTP 401 will go here
  return false;
  }
  if(responseString){
  var responseObject = JSON.parse(responseString);
  return responseObject.authenticated;
  }
  return false;*/
}