var db = SharedDb.getDb();


function saveObjToDb(obj){
  try{
    var savedObj = db.save(obj);
    return "Saved ID - " + savedObj.getId();
  }catch(e){
    log(e);
    throw(e);
  }
}

function getCount(query){
  try{
    return "Current count for query is - " + db.count(query);
  }catch(e){
    log(e);
    throw(e);
  }
}

function loadIDsFromDb(idlist){
  try{
    return db.load(idlist);
  }catch(e){
    log(e);
    throw(e);
  }
}

function deleteByIds(idlist){
  var obs_to_remove = loadIDsFromDb(idlist);
  var results = db.removeBatch(obs_to_remove, false);
  if (db.allOk(results)) {
    return "Delete by IDs successfull!";
  }
  var failedObs = [];
  for (var i = 0; i < results.length; i++) {
    if (!results[i].successful()) {
      failedObs.push(obs_to_remove[i]);
    }
  }
  return "Failed to delete " + failedObs.length + " item(s) out of " + results.length;
}

function queryFromDb(query){
  try{
    var result = db.query(query);
    var response = {};
    while (result.hasNext()) {
      var current = result.next();
      response[current.getId()] = current;
    }
    return response;
  }catch(e){
    log(e);
    throw(e);
  }
}

function deleteAll(query) {
  try{
    while (true) {
      var result = db.query(query); 
      if (result.getSize() == 0) {
        break;
      }
      while (result.hasNext()) {
        db.remove(result.next());
      }
    }
    return "Delete for specified query successful!";
  }catch(e){
    log(e);
    throw(e);
  }
}

function log(msg){
  //write to a logger here
  //DocsList.getFileById('0B0JNj_IM2wiPMS1lZTFhZjVjNC0yZTBjLTRiOWItYWVhMy0yYTU1ZjdkMGVkMGE').append(msg+'\n');
}