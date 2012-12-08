
function scanEmail(){
  //for performance sake, we'll scan top 3 threads for now. 
  //a more intelligent trigger would know it last left off and then pick it up from there
  var threads = GmailApp.getInboxThreads(0, 5);
  for (var i = 0; i < threads.length; i++) {
    var message = threads[i].getMessages()[0]; //for now, only scan first message
    if(message.getAttachments().length < 1)
      continue;
    

    var attachment = message.getAttachments()[0]; //for now, only first attachment
    Logger.log(attachment.getName());
    var base64content = Utilities.base64Encode(attachment.getAs('application/pdf').getBytes());
    
    
    var fromAddress = message.getFrom();
    //this will return of the the format - Arun Nagarajan <arun.appsscript@gmail.com>
    var actualAddress = /<(.*?)>/.exec(fromAddress)[1];
    var soql = encodeURIComponent("select Id from contact where Email='"+actualAddress+"'");
    //Logger.log(actualAddress);
    var responseObject = Utilities.jsonParse(runSOQL(soql));
    if(responseObject.totalSize !== 0){
      var contactId = responseObject.records[0].Id;
      
      var payload = Utilities.jsonStringify(
        {
          'Name' : attachment.getName() + '_GmailAttachment.pdf',  
          'ParentId' : contactId,
          'body' : base64content
        });
      Logger.log(contactId);
      var getDataURL = UserProperties.getProperty(baseURLPropertyName) + '/services/data/v26.0/sobjects/Attachment/';
      var response = UrlFetchApp.fetch(getDataURL,getUrlFetchPOSTOptions(payload)).getContentText();
      Logger.log(response);
    }
  }
}
