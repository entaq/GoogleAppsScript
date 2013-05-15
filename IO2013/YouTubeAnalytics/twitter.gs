function twitter(){
  var oauthCfg = UrlFetchApp.addOAuthService('twitter');
  oauthCfg.setAccessTokenUrl('https://api.twitter.com/oauth/access_token');
  oauthCfg.setRequestTokenUrl('https://api.twitter.com/oauth/request_token');
  oauthCfg.setAuthorizationUrl('https://api.twitter.com/oauth/authorize');
  oauthCfg.setConsumerKey(ScriptProperties.getProperty('TWITTER_CLIENT_ID'));
  oauthCfg.setConsumerSecret(ScriptProperties.getProperty('TWITTER_CLIENT_SECRET'));
  var options = {oAuthServiceName:'twitter',oAuthUseToken:'always'};
  
  var WOEIDs = {};
  WOEIDs['United States'] = '23424977';
  WOEIDs['Brazil'] = '23424768'
  WOEIDs['South Africa'] = '23424942'
  WOEIDs['United Kindom'] = '23424975';
  WOEIDs['Canada'] = '23424775'
  
  var headers = [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  for(var woe in WOEIDs){
    var url = 'https://api.twitter.com/1.1/trends/place.json?id='+WOEIDs[woe]; //eg. all = 1, london = 44418
    var response = UrlFetchApp.fetch(url, options).getContentText();
    
    var myObject = JSON.parse(response)[0];
    var trends = []
    for(var i = 0;myObject.trends && i<myObject.trends.length;i++){
      trends.push(myObject.trends[i].name);
    }
    ss.appendRow([myObject.as_of,woe,trends.join(', ')]);
  }
  
}
