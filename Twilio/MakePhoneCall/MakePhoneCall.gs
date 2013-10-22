var ACCOUNT_SID = 'ACd4e8e6872e581bf4cf560d37fb9059db';
var ACCOUNT_TOKEN = 'YOUR_TOKEN_HERE';

//This is a spreadsheet bound script that is also deployed as a web app

//Have a menu or a button point this function to kick things off
function readRows() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var rows = sheet.getDataRange();
  var numRows = rows.getNumRows();
  var values = rows.getValues();
  
  //for testing purposes just make call against first row
  //expecting columns in this order - name, number, message - 
  for (var i = 1; i <= 1/*numRows - 1*/; i++) {
    makePhoneCall(values[i][0],values[i][1],values[i][2]);
  }
}

function makePhoneCall(name,number, message){
  //URL is the callback to the current service with the message
  var url = ScriptApp.getService().getUrl() + '?MSG'+message.replace(/ /g,'+'); //can't seem to send = in here
  Logger.log(url);
  var payload = {
    "From" : "2246773902"
    ,"To" : number
    ,"Url": url
    ,"Method" : "GET"
  };
  
  var headers = {
    "Authorization" : "Basic " + Utilities.base64Encode(ACCOUNT_SID + ':' + ACCOUNT_TOKEN)
  };
  
  // Because payload is a JavaScript object, it will be interpreted as 
  // an HTML form. (We do not need to specify contentType; it will
  // automatically default to either 'application/x-www-form-urlencoded' 
  // or 'multipart/form-data')
  
  var options =
      {
        "method" : "post",
        "payload" : payload,
        "headers" : headers
      };
  Logger.log("calling " + name + " at " + number + " with messsage - " + message);           
  var url = 'https://api.twilio.com/2010-04-01/Accounts/'+ACCOUNT_SID+'/Calls.json';
  var response = UrlFetchApp.fetch(url, options);
  //Logger.log(response.getResponseCode());
  //Logger.log(response.getContentText());
}

//entry point to the call back
function doGet(args){
  var msg = '';
  for (var p in args.parameters) {
    //there are many incoming query params. lets find ours starting with a MSG
    if(p.indexOf('MSG') > -1){
      msg += p.replace('MSG','');
      break;
    }
    // there HAS to tbe a better way to get the entire query string!
  }
  
  var t = HtmlService.createTemplateFromFile("twiml.html");
  t.msg = msg;
  var content = t.evaluate().getContent();
  return ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.XML);
}



