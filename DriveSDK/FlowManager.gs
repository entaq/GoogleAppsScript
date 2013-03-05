var AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/auth'; 
var TOKEN_URL = 'https://accounts.google.com/o/oauth2/token'; 

var REDIRECT_URL= 'YOUR_REDIRECT_URL';//ScriptApp.getService().getUrl();
var tokenPropertyName = 'GOOGLE_OAUTH_TOKEN'; 

var CLIENT_ID = 'YOUR_CLIENT_ID';
var CLIENT_SECRET = 'YOUR_CLIENT_SECRET';

function doGet(e) {
  var HTMLToOutput;
  
  if(e.parameters.state){
    var state = JSON.parse(e.parameters.state);
    if(state.action === 'create'){
      var meetingURL = createMeetingNotes();
      HTMLToOutput = "<html><h1>Meeting notes document created!</h1><a href='"+meetingURL+"'>click here to open</a></html>"; 
    }
    else {
      zipAndSend(state.exportIds,Session.getEffectiveUser().getEmail());
      HTMLToOutput = "<html><h1>Email sent. Check your inbox!</h1></html>"; 
    }
  }
  else if(e.parameters.code){//if we get "code" as a parameter in, then this is a callback. we can make this more explicit
    getAndStoreAccessToken(e.parameters.code);
    HTMLToOutput = '<html><h1>App is installed, you can close this window now or navigate to your <a href="https://drive.google.com">Google Drive</a>.</h1></html>';
  }
  else {//we are starting from scratch or resetting
    HTMLToOutput = "<html><h1>Install this App into your Google Drive!</h1><a href='"+getURLForAuthorization()+"'>click here to start</a></html>";
  }
  return HtmlService.createHtmlOutput(HTMLToOutput);
}

function getURLForAuthorization(){
  return AUTHORIZE_URL + '?response_type=code&client_id='+CLIENT_ID+'&redirect_uri='+REDIRECT_URL +
    '&scope=https://www.googleapis.com/auth/drive.install https://www.googleapis.com/auth/userinfo.email';  
}

function getAndStoreAccessToken(code){
  var parameters = { method : 'post',
                    payload : 'client_id='+CLIENT_ID+'&client_secret='+CLIENT_SECRET+'&grant_type=authorization_code&redirect_uri='+REDIRECT_URL+'&code=' + code};
  
  var response = UrlFetchApp.fetch(TOKEN_URL,parameters).getContentText();   
  var tokenResponse = JSON.parse(response);
  UserProperties.setProperty(tokenPropertyName, tokenResponse.access_token);
}

function getUrlFetchOptions() {
  return {'contentType' : 'application/json',
          'headers' : {'Authorization' : 'Bearer ' + UserProperties.getProperty(tokenPropertyName),
                       'Accept' : 'application/json'}};
}

//naive check, not using for now, use refresh tokens and add proper checking
function isTokenValid() {
  return UserProperties.getProperty(tokenPropertyName);
}

