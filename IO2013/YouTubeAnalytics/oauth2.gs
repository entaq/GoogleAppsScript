
var AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/auth'; //step 1. we can actually start directly here if that is necessary
var TOKEN_URL = 'https://accounts.google.com/o/oauth2/token'; //step 2. after we get the callback, go get token

var CLIENT_ID = ScriptProperties.getProperty('GOOGLE_YTA_OAUTH_CLIENT_ID');
var CLIENT_SECRET = ScriptProperties.getProperty('GOOGLE_YTA_OAUTH_CLIENT_SECRET');

//PUT YOUR URL HERE -
var REDIRECT_URL= 'https://script.google.com/macros/s/AKfycbyFabJD1uUo3NNXAVVlFVapCRnJw7dJKBmCF3X9nzhgPmxZbRM/exec';


var oauthTokenPropertyName = 'GOOGLE_OAUTH_ACCESS_TOKEN'; 
var oauthTokenExpiresPropertyName = 'GOOGLE_OAUTH_ACCESS_TOKEN_EXPIRES'; 
var refreshTokenPropertyName = 'GOOGLE_OAUTH_REFRESH_TOKEN'; 


function getURLForAuthorization(){
  return AUTHORIZE_URL + '?response_type=code&client_id='+CLIENT_ID+'&redirect_uri='+REDIRECT_URL +
    '&scope=https://www.googleapis.com/auth/yt-analytics.readonly&approval_prompt=force&access_type=offline&state=/profile';  
}

function getAndStoreAccessToken(code){
  var parameters = {
    method : 'post',
    payload : 'client_id='+CLIENT_ID+'&client_secret='+CLIENT_SECRET+'&grant_type=authorization_code&redirect_uri='+REDIRECT_URL+'&code=' + code
  };
  
  var response = UrlFetchApp.fetch(TOKEN_URL,parameters).getContentText(); 
  storeOAuthValues_(response);
}

function getUrlFetchOptions() {
  var token = UserProperties.getProperty(oauthTokenPropertyName);
  return {
    "contentType" : "application/json",
    "headers" : {
      "Authorization" : "Bearer " + token,
      "Accept" : "application/json"
    }
  };
}

function attemptTokenRefresh_() {
  var refreshToken = UserProperties.getProperty(refreshTokenPropertyName);
  if (!refreshToken) {
    Logger.log('No refresh token available to refresh with ' + tokenKey);
    return false;
  }
  var requestData = {
    method: 'post',
    payload: {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }
  };
  Logger.log('Attempting token refresh');
  var response = UrlFetchApp.fetch(TOKEN_URL, requestData).getContentText();
  storeOAuthValues_(response);
  return true;
}

function storeOAuthValues_(response){
  var tokenResponse = JSON.parse(response);
  
  var accessToken = tokenResponse.access_token;
  // expires_in is in seconds and Date.now is ms
  var endMs = Date.now() + tokenResponse.expires_in * 1000;
  var refreshToken = tokenResponse.refresh_token;
  
  
  //store the token for later retrival
  UserProperties.setProperty(oauthTokenPropertyName, accessToken);
  if (refreshToken) { //on a refresh call we wont get a new refresh token, lets not wipe prev one out
    UserProperties.setProperty(refreshTokenPropertyName, refreshToken);
  }
  UserProperties.setProperty(oauthTokenExpiresPropertyName, endMs);
}

function isOAuthed() {
  if (hasValidToken_()) {
    Logger.log('Valid oauth token found');
    return true;
  } else {
    try {
      return attemptTokenRefresh_();
    } catch (e) {
      Logger.log('Failed to refresh token with error: ' + e);
      return false;
    }
  }
}

function hasValidToken_() {
  if (!isTokenPresent_()) {
    return false;
  }
  return (!isTokenExpired_());
}

function isTokenExpired_() {
  var expirationTimeMs = UserProperties.getProperty(oauthTokenExpiresPropertyName);
  if (!expirationTimeMs) {
    return true;
  }
  expirationTimeMs = Number(expirationTimeMs);
  var threshold = Date.now() + 30000;
  return (expirationTimeMs < threshold);
}

function isTokenPresent_() {
  var token = UserProperties.getProperty(oauthTokenPropertyName);
  if(!token){ //if its empty or undefined
    return false;
  }
  return true; 
}