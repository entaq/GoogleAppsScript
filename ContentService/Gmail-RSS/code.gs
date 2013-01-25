function doGet() {  
  var content = HtmlService.createTemplateFromFile('rss').evaluate().getContent();
  return ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.RSS);
}
