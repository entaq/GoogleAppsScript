//this is the source code for "Zip and send" app on the Chrome Web Store you can install into your Google Drive
function doGet(e) {
  var state = JSON.parse(e.parameters.state);
  zipAndSend(state.exportIds,Session.getEffectiveUser().getEmail());
  return HtmlService.createHtmlOutput("<html><h1>Email sent. Check your inbox!</h1></html>");
}

function zipAndSend(fileIds,emailAddress){
  var names = {};
  var zipFile = Utilities.zip(fileIds.map(function(i){
    var f = DocsList.getFileById(i);
    Logger.log(f.getName());
    var n = f.getName() + '.pdf';
    while (names[n]) { n = '_' + n }
    names[n] = true;
    return f.getAs('application/pdf').setName(n);
  }), 'FilesForYou.zip')
  MailApp.sendEmail(emailAddress, 'Files you requested', 'Attached is the ZIP of the pdf documents we discussed', {attachments: [zipFile]});
}
