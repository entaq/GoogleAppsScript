function onOpen(){
  SpreadsheetApp.getActiveSpreadsheet()
  .addMenu('We the people',[{name:'Search Petitions', functionName:'showUI'},
                            {name:'Load Signatures', functionName:'loadSignatures'},
                            null,
                            {name: 'Twitter trending', functionName:'twitter'}]);//future ideas
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

/*
id: "51a8efdfa9a0b1c82c000006",
type: "petition",
title: "Condemn the actions taken against peaceful protesters in Istanbul Turkey.",
body: "There are gross human rights violations occurring in Istanbul, Turkey. Police have fired water cannons and smoke bombs into peaceful protests against the plans to put a development in the park Gezi in Taksim. http://www.bbc.co.uk/news/world-europe-22732139 http://www.nytimes.com/2013/06/01/world/europe/police-attack-protesters-in-istanbuls-taksim-square.html?pagewanted=all&_r=0 Signing this petition would help draw international attention to the issue. ",
issues: [
{
id: "20",
name: "Environment"
},
{
id: "28",
name: "Human Rights"
},
{
id: "175",
name: "Urban Policy"
}
],
signatureThreshold: 100000,
signatureCount: 2012,
signaturesNeeded: 97988,
url: "https://petitions.whitehouse.gov/petition/condemn-actions-taken-against-peaceful-protesters-istanbul-turkey/zDGtGCDZ",
deadline: 1372617951,
status: "open",
response: null,
created: 1370025951
*/

function getData(title,body,startdate,enddate,sig,status){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  sheet.clear();
  var base_url = 'https://api.whitehouse.gov/v1/petitions.json?';
  
  var additionParams = Utilities.formatString('title=%s&body=%s&signatureCountFloor=%s&status=%s&createdAfter=%s&createdBefore=%s'
                                              ,title,body,sig,status,returnUnixtimestamp(startdate),returnUnixtimestamp(enddate));
  
  var getDataURL = base_url + 'limit=99&offset=0&'+additionParams;
  Logger.log(getDataURL);
  var dataResponse = UrlFetchApp.fetch(getDataURL).getContentText();  
  var dataObj = JSON.parse(dataResponse);
  var headers = ['ID','Title','Body','Deadline','Status','Response','Created','Signature Count'];
  var maxLetter = String.fromCharCode(64 + headers.length);
  
  sheet.appendRow(headers);
  
  sheet.getRange('A1:'+maxLetter+'1').setBackground('Grey').setFontStyle('oblique');
  
  ss.setColumnWidth(2, 220);
  ss.setColumnWidth(3, 625);
  var rows = [];
  for(var i = 0;dataObj.results && i<dataObj.results.length;i++){
    var row = dataObj.results[i];
    var responseFormula = "";
    if (row.response) {
      responseFormula = row.response.url;
    }
    rows.push(['=hyperlink("'+row.url+'","'+row.id+'")',row.title,row.body,returnDate(row.deadline),row.status,responseFormula,returnDate(row.created),row.signatureCount]);
  }
  var rowsCount = rows.length+1;
  ss.getRange('A2:'+maxLetter+rowsCount).setValues(rows);
}


/*
{
id: "50d43ea16ce61c5910000008",
type: "signature",
name: "D. S.",
city: "Bethel",
state: "VT",
zip: "05032",
created: 1356086945
}
*/
function loadSignatures(){
 var petitionId = SpreadsheetApp.getActiveRange().getValue();
  var initialPageCount = 99; //because a default sheet has only 100 rows to start
  
  var sheet = createOrSetActiveSheet(petitionId);
  var base_url = 'https://api.whitehouse.gov/v1/petitions/'+petitionId+'/signatures.json?';
  var getDataURL = base_url + 'limit='+initialPageCount+'&offset=0';

  var dataResponse = UrlFetchApp.fetch(getDataURL).getContentText();  
  var dataObj = JSON.parse(dataResponse);
  var headers = ['ID','Name','City','State','ZIP','Created'];
  var maxLetter = String.fromCharCode(64 + headers.length);
  
  sheet.appendRow(headers);
  sheet.getRange('A1:'+maxLetter+'1').setBackground('Grey').setFontStyle('oblique');
  var rows = [];
  for(var i = 0;dataObj.results && i<dataObj.results.length;i++){
    var row = dataObj.results[i];
    rows.push([row.id,row.name,row.city,row.state,row.zip,returnDate(row.created)]);
  }
  var rowsCount = rows.length+1;
  sheet.getRange('A2:'+maxLetter+rowsCount).setValues(rows);
}