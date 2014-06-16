//sample instance
//http://scn.sap.com/docs/DOC-40986


function onOpen(){
  SpreadsheetApp.getActiveSpreadsheet()
  .addMenu('SAP NetWeaver',[{name:'SAP Data Wizard', functionName:'showUI'},
                            null,
                            {name:'Load Business Partners', functionName:'getBusinessPartnerData'},
                            {name:'Load Sales Orders', functionName:'getSalesOrderData'},
                            null,
                            {name:'Load Items for Sales Order', functionName:'loadSalesItems'},
                            null,
                            {name: 'Post to Google+', functionName:'googleplus'}]);//future ideas
}

function showUI(){
  var ui = HtmlService.createTemplateFromFile('ui').evaluate().setSandboxMode(HtmlService.SandboxMode.NATIVE).setHeight(550);
  
  SpreadsheetApp.getActiveSpreadsheet().show(ui);
}

function returnDate(unix_timestamp){
  //var unix_timestamp = '1370025951';
  var date = new Date(unix_timestamp*1000);
  //Logger.log(date);
  return date;
}

function returnUnixtimestamp(dateString){
  //var dateString = '2013-04-01';
  var parts = dateString.match(/(\d+)/g);  
  var date = new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
  var timestamp = date.getTime()/1000 + '';
  return timestamp;
}


function createOrSetActiveSheet(sheetName){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var sheet;
  for(var i = 0;i<sheets.length;i++){
    sheet = sheets[i];
    var currentSheetName = sheet.getSheetName();
    if(sheetName===currentSheetName){
      ss.setActiveSheet(sheet);
      sheet.clear();
      return sheet;
    }
  }
  sheet = ss.insertSheet();
  sheet.setName(sheetName);
  ss.setActiveSheet(sheet);
  return sheet;
}

//future ideas
function sendNightlyEmail(){
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Published Dashboard');
  var chart = sheet.getCharts()[0];  
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Daily petition report', 'See attached image', {name:'Sharing chart',attachments:[chart.getBlob()]});
}


function getBusinessPartnerData(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  sheet.clear();
  
  
  var base_url = "https://sapes1.sapdevcenter.com/sap/opu/odata/IWBEP/GWDEMO/BusinessPartnerCollection/?";
  var additionParams = "$format=json";
  var user = 'YOUR_USERNAME';
  var password = 'YOUR_PASSWORD';
  var header = 'Basic '+Utilities.base64Encode(user+':'+password);
  
  
  var getDataURL = base_url + additionParams;
  Logger.log(getDataURL);
  
  var dataResponse = UrlFetchApp.fetch(getDataURL,{headers: {Authorization: header}, muteHttpExceptions: true}).getContentText();  
  var dataObj = JSON.parse(dataResponse);
  var headers = ['Key','Name','Role','Website','Email','Address'];
  
  var maxLetter = String.fromCharCode(64 + headers.length);
  
  sheet.appendRow(headers);
  
  sheet.getRange('A1:'+maxLetter+'1').setBackground('Grey').setFontStyle('oblique');
  
  ss.setColumnWidth(2, 220);
  ss.setColumnWidth(3, 89);
  
  var rows = [];
  for(var i = 0;dataObj.d.results && i<dataObj.d.results.length;i++){
    var row = dataObj.d.results[i];
    
    rows.push([row.BusinessPartnerKey,row.Company,row.BusinessPartnerRoleText,row.WebAddress, row.EmailAddress, 'street address']);
  }
  var rowsCount = rows.length+1;
  ss.getRange('A2:'+maxLetter+rowsCount).setValues(rows);
}


function getSalesOrderData(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  sheet.clear();
  
  
  var base_url = "https://sapes1.sapdevcenter.com/sap/opu/odata/IWBEP/GWDEMO/SalesOrderCollection/?";
  var additionParams = "$format=json";
  var user = 'YOUR_USERNAME';
  var password = 'YOUR_PASSWORD';
  var header = 'Basic '+Utilities.base64Encode(user+':'+password);
  
  
  var getDataURL = base_url + additionParams;
  Logger.log(getDataURL);
  
  var dataResponse = UrlFetchApp.fetch(getDataURL,{headers: {Authorization: header}, muteHttpExceptions: true}).getContentText();  
  var dataObj = JSON.parse(dataResponse);
  var headers = ['Sales Order Key','Customer Name','Status','Currency','Total Amt','Tax Amt','Note','Created By','Changed By'];
  
  var maxLetter = String.fromCharCode(64 + headers.length);
  
  sheet.appendRow(headers);
  
  sheet.getRange('A1:'+maxLetter+'1').setBackground('Grey').setFontStyle('oblique');
  
  ss.setColumnWidth(2, 220);
  ss.setColumnWidth(3, 89);
  
  var rows = [];
  for(var i = 0;dataObj.d.results && i<dataObj.d.results.length;i++){
    var row = dataObj.d.results[i];
    
    rows.push([row.SalesOrderKey,row.CustomerName,row.StatusDescription,row.Currency,row.TotalSum,row.Tax,row.Note,row.CreatedByEmployeeLastName,row.ChangedByEmployeeLastName]);
  }
  var rowsCount = rows.length+1;
  ss.getRange('A2:'+maxLetter+rowsCount).setValues(rows);
}


function loadSalesItems(){
 var salesOrderKey = SpreadsheetApp.getActiveRange().getValue();
  var initialPageCount = 99; //because a default sheet has only 100 rows to start
  
  var sheet = createOrSetActiveSheet(salesOrderKey);
  var base_url = "https://sapes1.sapdevcenter.com/sap/opu/odata/IWBEP/GWDEMO/SalesOrderCollection('"+salesOrderKey+"')/salesorderlineitems?";
  var getDataURL = base_url + '$format=json';
  
  var user = 'YOUR_USERNAME';
  var password = 'YOUR_PASSWORD';
  var header = 'Basic '+Utilities.base64Encode(user+':'+password);
  Logger.log(getDataURL);

  var dataResponse = UrlFetchApp.fetch(getDataURL,{headers: {Authorization: header}, muteHttpExceptions: true}).getContentText();  
  Logger.log(dataResponse);
  var dataObj = JSON.parse(dataResponse);
  var headers = ['SalesOrderItemKey','ProductName','Availability','Note','Currency','NetSum','Tax','TotalSum'];
  var maxLetter = String.fromCharCode(64 + headers.length);
  
  sheet.appendRow(headers);
  sheet.getRange('A1:'+maxLetter+'1').setBackground('Grey').setFontStyle('oblique');
  var rows = [];
  for(var i = 0;dataObj.d.results && i<dataObj.d.results.length;i++){
    var row = dataObj.d.results[i];
    rows.push([row.SalesOrderItemKey,row.ProductName,row.Availability,row.Note,row.Currency,row.NetSum,row.Tax,row.TotalSum]);
  }
  var rowsCount = rows.length+1;
  sheet.getRange('A2:'+maxLetter+rowsCount).setValues(rows);
}