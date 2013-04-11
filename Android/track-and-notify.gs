//create an onEdit trigger for this! in a spreadsheet bound script
//import shared db library
function sendNotification(){
  var msg = "Edited at: " + new Date().toTimeString();  
  SharedDb.sendGCM(msg);
}
