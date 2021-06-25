
export function PacketBuffer(hardwareMap = {}, options = {}) {
  this.buffer = {}
  this.mapObjects = {}
  this.offlineHardware = {}
  this.bufferHasData = false
  this.hardwareMap = hardwareMap
  this.options = options
}

PacketBuffer.prototype.updateBuffer = function(data) {
  if (!!data && (data.pos.x !== 0 && data.pos.y !== 0)) {
    let { tagId } = data8
    if (!tagId) tagId = data.id
    if (!this.buffer.hasOwnProperty(tagId)) {
      if (this.offlineHardware[data.id]) {
        console.log('== DEVICE REJOINING! : ' + tagId + ' :' + tagId + ' ==');
      } else {
        console.log('== NEW DEVICE! : ' + tagId + ' :' + tagId + ' ==');
      }
      this.buffer[tagId] = [];
    }
    while (this.buffer[tagId].length > 3) {
      this.buffer[tagId].shift();
    }
    this.buffer[tagId].push(data);
  }
  if (this.offlineHardware[data.id]) delete this.offlineHardware[data.id]
}

PacketBuffer.prototype.runBufferPos = function(setPos, cb) {
  let { field } = this
  this.bufferHasData = false;

  for (let key in this.buffer) {
    //--> Push Buffer Length for Each Tag

    if (this.buffer[key].length > 1) {
      let i = 0;
      let prevBuffer = this.buffer[key][0];
      let t1 = 0;
      let t2 = 0;

      for (i = 1; i < this.buffer[key].length; i++) {

        this.bufferHasData = true;

        let buffer = this.buffer[key][i];

        t1 = Math.round(prevBuffer.timestamp * 1000);
        t2 = Math.round(buffer.timestamp * 1000);

        let x;
        let y;
        let z;
        if (t1 !== t2) {
          x = this.interpolate(prevBuffer.pos.x, buffer.pos.x, t1, t2, t2);
          y = this.interpolate(prevBuffer.pos.y, buffer.pos.y, t1, t2, t2);
          z = this.interpolate(prevBuffer.pos.z, buffer.pos.z, t1, t2, t2);
        } else {
          x = buffer.pos.x
          y = buffer.pos.y
          z = buffer.pos.z
        }

        if (z < 0) {
          z = 0
        }

        //--> Draw circle on map
        if (!this.mapObjects.hasOwnProperty(key)) {
          this.mapObjects[key] = {
            x: 0,
            y: 0,
            z: 0
          }
        }

        this.mapObjects[key].x = x;
        this.mapObjects[key].y = y;
        this.mapObjects[key].z = z;
        this.mapObjects[key].vel = this.buffer[key][i].vel;
        this.mapObjects[key].timestamp = this.buffer[key][i].timestamp;
        this.mapObjects[key].type = this.hardwareMap[key]

        // record measurements if in diags mode
        if (this.options.diagnostics) {
          this.mapObjects[key].meas = this.buffer[key][i].meas
        }

        break;
      }
    }
  }
  if (cb) {
    cb();
  } else {
    console.log('callback required')
  }
}

PacketBuffer.prototype.interpolate = function(v1, v2, t1, t2, t3) {
  return v1 + ((t3 - t1) * (v2 - v1) / (t2 - t1));
}

PacketBuffer.prototype.clearBuffers = function() {
  this.mapObjects = {}
  this.buffer = {}
}

PacketBuffer.prototype.cleanBuffer = function() {
  this.interval = setInterval(() => {
    let timeNow = new Date().getMilliseconds()
    for (let id in this.buffer) {
      if (this.buffer.hasOwnProperty(id)) {
        let hardwareBuffer = this.buffer[id]
        let lastPacket = hardwareBuffer[hardwareBuffer.length - 1]
        if (timeNow - lastPacket.timestamp * 1000 > 4000) {
          this.offlineHardware[id] = lastPacket
          delete this.buffer[id]
        }
      }
    }
  }, 5000)
}

PacketBuffer.prototype.stopBuffer = function() {
  // Stop cleaning buffer
  clearInterval(this.interval)
}
