function onOpen(){
  SpreadsheetApp.getActiveSpreadsheet()
  .addMenu('YouTube Analytics',[{name:'Ad hoc report', functionName:'showUI'},
                                {name: 'Twitter trending', functionName:'twitter'}]);
}

function showUI(){
  var ui = HtmlService.createTemplateFromFile('ui').evaluate().setSandboxMode(HtmlService.SandboxMode.NATIVE).setHeight(350);
  SpreadsheetApp.getActiveSpreadsheet().show(ui);
}

function sendNightlyEmail(){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Published Dashboard');
  var chart = sheet.getCharts()[0];  
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Daily YouTube Sharing report', 'See attached image', {name:'Sharing chart',attachments:[chart.getBlob()]});
}
  
function alertOnViewsIncrease(){
  //perform business logic here to compare against previously stored values/thresholds
}

function doGet(e) {
  var HTMLToOutput;
  if(e.parameter.code){//if we get "code" as a parameter in, then this is a callback. we can make this more explicit
    getAndStoreAccessToken(e.parameters.code);
    HTMLToOutput = HtmlService.createHtmlOutputFromFile('oauthsuccess').getContent();
  }
  else if(isTokenValid()){//we already have a valid token  but this should never start here.
    HTMLToOutput = '<html><h1>Invalid access</h1></html>';
  }
  else {//we are starting from scratch but this should never start here.
    HTMLToOutput = "<html><h1>Invalid access</h1></html>";
  }
  return HtmlService.createHtmlOutput(HTMLToOutput).setSandboxMode(HtmlService.SandboxMode.NATIVE);
}


function getData(startdate,enddate,metrics,dimensions){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  //these are the channels and contentOwner settings we care for -  
  var ids	= 'contentOwner==promo-pso-brazil';
  var filters	= 'channel==UCEN58iXQg82TXgsDCjWqIkg';
  
  var sheet = ss.insertSheet();
  ss.setActiveSheet(sheet);
  var base_url = 'https://www.googleapis.com/youtube/analytics/v1/reports?';
  var getDataURL = base_url + 'ids='+ids+'&start-date='+startdate+'&end-date='+enddate+'&metrics='+metrics+'&dimensions='+dimensions+'&filters='+filters;
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
}
