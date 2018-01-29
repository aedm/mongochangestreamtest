const MongoClient = require('mongodb').MongoClient;
const URL = 'mongodb://localhost:27017';
const DB_NAME = 'streamtest';
const APP_NAME = "OneStream";

let mongoConnection = null;

function quit() {
  if (mongoConnection !== null) mongoConnection.close();
  console.log("bye");
  process.exit();
}

async function main() {
  mongoConnection = await MongoClient.connect(URL, {appname: APP_NAME});
  console.log("Connected successfully to server");
  let db = mongoConnection.db(DB_NAME);
  let collection = db.collection("chat");
  let cursor = collection.watch([{
    $match: {"fullDocument.x": 5}
  }]);
  let cursorStream = cursor.stream();

  // cursor.forEach(doc => console.log(doc));
  cursorStream.on("data", doc => {
    console.log(doc);
  });
  console.log("Clients created.");
}

main().catch(er => console.error(er));

// Go on forever until killed
setInterval(() => {}, 30000);
process.on('SIGINT', quit);