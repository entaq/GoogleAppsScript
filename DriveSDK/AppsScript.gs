//look for the first mtg right now in the user's calendar from now till next 2 hours
function createMeetingNotes() {
  var lowerBound = new Date();
  var upperBound = new Date();
  upperBound.setHours(lowerBound.getHours()+2);
  
  var appts = CalendarApp.getEvents(lowerBound, upperBound);
  if(!appts || appts.length ==0){
    Logger.log('No current appointments!');
    return '';
  }
  
  //naive implementation for demo - ideally we'll provide a picker if double booked
  var appt = appts[0];
  var doc = DocumentApp.create('Meeting notes for ' + appt.getTitle());
  doc.appendParagraph('Time: ' + appt.getStartTime());
  doc.appendParagraph('Location: ' + appt.getLocation());
  doc.appendParagraph('Attendees: ' + getEmails(appt));
  doc.appendHorizontalRule();
  doc.appendParagraph(appt.getDescription());
  return doc.getUrl();
}

function getEmails(appt){
  var guests = appt.getGuestList(true);
  var emails = '';
  for(var i=0;i<guests.length;i++){
    emails += guests[i].getEmail() + ', ';
  }
  return emails.slice(0,-2);
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