function createCalendar(){
  var API_KEY = 'YOU_API_KEY_HERE';
  var cal = CalendarApp.createCalendar('GDL Calendar');
  var url = 'https://www.googleapis.com/youtube/v3/activities?'
              +'part=snippet&channelId=UC_x5XG1OV2P6uZZ5FSM9Ttw&maxResults=20&publishedBefore=2013-02-25T00:00:00.0Z'
              +'&key='+API_KEY;
  var response = UrlFetchApp.fetch(url).getContentText();
  
  var responseObject = JSON.parse(response);
  
  for(var i=0;responseObject.items && i<responseObject.items.length;i++){
    var item = responseObject.items[i];
    cal.createEvent(item.snippet.title, new Date(item.snippet.publishedAt), new Date(item.snippet.publishedAt));
  }
  
  Logger.log('https://www.google.com/calendar/embed?src='+cal.getId());
}