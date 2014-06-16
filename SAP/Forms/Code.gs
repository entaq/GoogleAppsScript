function onFormSubmit(e) {
  var myObject = {};
  var itemResponses = e.response.getItemResponses();
   for (var j = 0; j < itemResponses.length; j++) {
     var itemResponse = itemResponses[j];
     myObject[itemResponse.getItem().getTitle()] = itemResponse.getResponse();
     //Logger.log('"%s" was "%s"',itemResponse.getItem().getTitle(), itemResponse.getResponse());
   }
  
  Logger.log(myObject);
  
   var t = HtmlService.createTemplateFromFile('product_template');
  t.data = myObject;
  var postPayload =  t.evaluate().getContent();
  
  Logger.log(postPayload);
  
  var base_url = "https://sapes1.sapdevcenter.com/sap/opu/odata/IWBEP/GWDEMO/ProductCollection";
  var additionParams = "$format=json";
  var user = 'YOUR_USERNAME';
  var password = 'YOUR_PASSWORD';
  var header = 'Basic '+Utilities.base64Encode(user+':'+password);
  
  var headers = {
    Authorization: header,
    'X-CSRF-Token' : 'Fetch',
     "Content-Type": "application/atom+xml"
  }
                                        
                                        
  //Logger.log(headers);
  var response = UrlFetchApp.fetch(base_url,{headers: headers, muteHttpExceptions: true});
  var csrf_token = response.getAllHeaders()['x-csrf-token'];
  var cookie = response.getAllHeaders()['set-cookie'];
  
  //Logger.log(response.getAllHeaders());
  
  headers['X-CSRF-Token'] = csrf_token;
  headers['Cookie'] = cookie.join('; ');
  
  
  
  Logger.log(headers);
  
  //var deleteResponse = UrlFetchApp.fetch(id,{headers: headers, method : 'DELETE', muteHttpExceptions: true});
  
  
  var createResponse = UrlFetchApp.fetch(base_url,{headers: headers, method : 'POST', contentType : "application/atom+xml", payload: postPayload, muteHttpExceptions: true});
  
  Logger.log(createResponse.getContentText());
}
