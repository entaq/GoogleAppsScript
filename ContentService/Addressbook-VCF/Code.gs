function doGet() {
  var contact = ContactsApp.getContact('youremail@gmail.com');  
  
  var t = HtmlService.createTemplateFromFile('vcard_template');
  t.contact = contact;
  var output = t.evaluate().getContent();
  
  return ContentService.createTextOutput(output).downloadAsFile('ContactCard.vcf');
}
