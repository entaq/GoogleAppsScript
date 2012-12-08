//This is deployed as a web app and in the Twilio interface you'll point incoming SMS to the deployed URL
//deploy it to run as you and allow anyone (even anonymous) can access it

function doGet(args) {
  var spreadsheetID = 'YOUR_SPREAD_SHEETID';
  
  //Incoming params are documented here - https://www.twilio.com/docs/api/twiml/sms/twilio_request
  var vote = args.parameter.Body;
  var from = args.parameter.From;
  
  //sample poll here for favorite football team in NYC
  var actualVote;
  switch (vote.toLowerCase()) {
   case "a":
      actualVote = 'Giants';
      break;
   case "b":
      actualVote = 'Jets';
      break;
   default:
      actualVote = 'Dont care';
  }
  
  SpreadsheetApp.openById(spreadsheetID).appendRow([from,actualVote,vote]);
  
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
  //empty message sends no response. save a penny!
  
  //other funn stuff - quickly translate
  //return ContentService.createTextOutput(LanguageApp.translate(args.parameter.Body, "en", "es")).setMimeType(ContentService.MimeType.TEXT);
};


