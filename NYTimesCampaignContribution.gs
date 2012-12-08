function getData(){
  var API_KEY = 'YOUR_API_KEY_HERE';
  var url = 'http://api.nytimes.com/svc/elections/us/v3/finances/2012/president/states/NY.json?api-key='+API_KEY;
  
  var response = UrlFetchApp.fetch(url).getContentText();
  var respObj = JSON.parse(response);
  
  var ss = SpreadsheetApp.create('NY Presidential Campaign')
  //add a simple header
  ss.appendRow(['Candidate','Number of Contributions','Total $ Contributions']);
  
  for(var i in respObj.results){
    ss.appendRow([respObj.results[i].full_name,respObj.results[i].contribution_count,respObj.results[i].total]);
  }
}