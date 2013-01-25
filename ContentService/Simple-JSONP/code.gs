function doGet(request) {
  var result = 'hello world';
  var content = request.parameters.prefix + '(' +JSON.stringify(result) + ')';
  return ContentService.createTextOutput(content)
    .setMimeType(ContentService.MimeType.JSON);
}
