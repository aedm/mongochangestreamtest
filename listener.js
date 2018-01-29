const Chance = require('chance');

class Listener {
  constructor(collection, clientId, roomCount, joinCount, onReceived) {
    this.collection = collection;
    this.chance = new Chance();
    this.receivedCount = 0;
    this.sumDelay = 0;
    this.largestDelay = 0;

    // Generate list of rooms to subscribe to
    let rooms = this.generateRoomsToJoin(roomCount, joinCount);
    console.log(`Client ${clientId} joining rooms: ${rooms}`);

    this.cursors = rooms.map(roomId => {
      let cursor = collection.watch([
        {$match: {"fullDocument.room": roomId}},
      ]);
      cursor.stream().on("data", doc => {
        this.receivedCount++;
        onReceived(1);
        let delay = Date.now() - doc.fullDocument.created;
        this.sumDelay += delay;
        if (this.largestDelay < delay) this.largestDelay = delay;
      });
      return cursor;
    });
  }

  close() {
    this.cursors.forEach(cursor => cursor.close());
    console.log("Received count:", this.receivedCount);
    console.log("Average delay (ms):", this.sumDelay / this.receivedCount);
    console.log("Largest delay (ms):", this.largestDelay);
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