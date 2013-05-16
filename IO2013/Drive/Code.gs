function doGet(e) {
  var HTMLToOutput;
  if(e.parameter.state){
    var state = JSON.parse(e.parameter.state);
    if(state.action === 'create'){
      var newFolder =  DriveApp.createFolder('New Assignment');
      
      var templateQuiz = DriveApp.getFileById(QUIZ_TEMPLATE);
      var templateRoster = DriveApp.getFileById(ROSTER_TEMPLATE);
      
      var newQuiz = templateQuiz.makeCopy('Quiz Questions');
      newFolder.addFile(newQuiz);
      DriveApp.getRootFolder().removeFile(newQuiz);
      
      var newRoster = templateRoster.makeCopy('Roster');
      newFolder.addFile(newRoster);
      DriveApp.getRootFolder().removeFile(newRoster);
      
      var objectToSaveForClose = { type: 'close',
                                  rosterID : newRoster.getId()}
      
      var objectToSaveForPublish = { type: 'publish',
                                    assignmentFolderID : newFolder.getId(),
                                    rosterID : newRoster.getId(),
                                    quizID : newQuiz.getId()}
      
      var closeBlob = Utilities.newBlob(JSON.stringify(objectToSaveForClose), 'application/drive-assignment-creator', 'Close Quiz');
      var publishBlob = Utilities.newBlob(JSON.stringify(objectToSaveForPublish), 'application/drive-assignment-creator', 'Publish Quiz'); 
      newFolder.createFile(closeBlob);
      newFolder.createFile(publishBlob);
      
      HTMLToOutput = 'Assignment folder created with necessary template. Please update the Roster, fill in the quiz questions and click on the Publish icon in the folder. ';
    } else {
      var fileID = state.ids[0];
      var content = DriveApp.getFileById(fileID).getBlob().getDataAsString();
      var contentObject = JSON.parse(content);
      var ssID = contentObject.rosterID;
        var ss = SpreadsheetApp.openById(ssID);
        var sheet = ss.getSheets()[0];
        var rosterRange = ss.getRangeByName('RosterRange');
        var rosterObjects = getRowsData(sheet, rosterRange);
        
        
      if(contentObject.type === 'close'){
        for(var i in rosterObjects){
          var rosterItem = rosterObjects[i];
          var quickCopy = DriveApp.getFileById(rosterItem.fileid);
          quickCopy.removeEditor(rosterItem.studentEmailAddress);
          quickCopy.addViewer(rosterItem.studentEmailAddress); 
        }
        HTMLToOutput = 'Quiz is now closed. Your students will no longer be able to save any changes. They wil be able to view your notes on their quizes. ';
        
      }else if(contentObject.type === 'publish'){
        var quizFileID = contentObject.quizID;
        var quiz = DriveApp.getFileById(quizFileID);
        var folderID = contentObject.assignmentFolderID;
        var folder = DriveApp.getFolderById(folderID);
        
        for(var i in rosterObjects){
          var rosterItem = rosterObjects[i];
          var quizCopy = quiz.makeCopy('Quiz - ' + rosterItem.studentName);
          folder.addFile(quizCopy);
          DriveApp.getRootFolder().removeFile(quizCopy);
          quizCopy.addEditor(rosterItem.studentEmailAddress);
          rosterItem.fileid = quizCopy.getId();
        }
        setRowsData(sheet,rosterObjects);
        HTMLToOutput = 'Completed publishing your quizes. Your students should be able to see the files in their "Shared with me" view.';
      }
      
    }
    
  }
  else if(e.parameter.code){//if we get "code" as a parameter in, then this is a callback. we can make this more explicit
    getAndStoreAccessToken(e.parameter.code);
    HTMLToOutput = 'App is installed, you can close this window now or open up Google Drive.';
  }
  else {//we are starting from scratch or resetting
  }
  var t = HtmlService.createTemplateFromFile('ui')
  t.message = HTMLToOutput;
  return t.evaluate().setSandboxMode(HtmlService.SandboxMode.NATIVE)
}

function getURLForAuthorization(){
  return AUTHORIZE_URL + '?response_type=code&client_id='+CLIENT_ID+'&redirect_uri='+REDIRECT_URL +'&scope=https://www.googleapis.com/auth/drive.install';  
}

function getAndStoreAccessToken(code){
  var parameters = { method : 'post',
                    payload : 'client_id='+CLIENT_ID+'&client_secret='+CLIENT_SECRET+'&grant_type=authorization_code&redirect_uri='+REDIRECT_URL+'&code=' + code};
  //no need to do anything with the token going forward. 
  var response = UrlFetchApp.fetch(TOKEN_URL,parameters).getContentText();
}


//replace with any template files you want - 
var ROSTER_TEMPLATE = '0AkJNj_IM2wiPdEZzbFUxMjQteGtQS1JadHg5VmFMdGc';
var QUIZ_TEMPLATE = '1_LIZp1lahFhNouXsZNI1s6UluBskt_LOwQGlJIj2ftY';

var AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/auth'; 
var TOKEN_URL = 'https://accounts.google.com/o/oauth2/token'; 

//put your URL below or use ScriptApp.getService().getUrl();
var REDIRECT_URL= 'https://script.google.com/macros/s/AKfycbxK6aULLp8CL47aiUM_tHZCX9-2YNOK0yrp-ujnUQV8CrUQkUGk/exec';
var CLIENT_ID = ScriptProperties.getProperty('CLIENT_ID')
var CLIENT_SECRET = ScriptProperties.getProperty('CLIENT_SECRET');

