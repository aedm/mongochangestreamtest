const Chance = require('chance');

class Listener {
  constructor(collection, clientId, roomCount, joinCount, onReceived) {
    this.collection = collection;
    this.chance = new Chance();
    this.receivedCount = 0;
    this.sumDelay = 0;

    // Generate list of rooms to subscribe to
    let rooms = this.generateRoomsToJoin(roomCount, joinCount);
    console.log(`Client ${clientId} joining rooms: ${rooms}`);

    this.cursors = rooms.map(roomId => {
      let cursor = collection.aggregate([
        {$changeStream: {}},
        {$match: {"fullDocument.room": roomId}},
      ]);
      cursor.forEach(doc => {
        this.receivedCount++;
        onReceived(1);
        this.sumDelay = Date.now() - doc.fullDocument.created;
      });
      return cursor;
    });
  }

  close() {
    this.cursors.forEach(cursor => cursor.close());
    console.log("Received count:", this.receivedCount);
    console.log("Average delay (ms):", this.sumDelay / this.receivedCount);
  }

  generateRoomsToJoin(roomCount, joinCount) {
    let rooms = [];
    for (let i = 0; i < roomCount; i++) {
      rooms.push({id: i + 1, random: this.chance.integer()});
    }
    rooms.sort((a, b) => a.random - b.random);
    return rooms.slice(0, joinCount).map(x => x.id);
  }

}

module.exports = {
  Listener,
};