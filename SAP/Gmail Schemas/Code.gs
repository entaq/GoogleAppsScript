function testSchemas() {
  var htmlBody = HtmlService.createHtmlOutputFromFile('mail_template').getContent();

  GmailApp.sendEmail(Session.getEffectiveUser().getEmail(),'Alert for SAP - ' + new Date(),'',
    {htmlBody: htmlBody});
}
