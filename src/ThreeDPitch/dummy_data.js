import { dataTypes } from './data_types'


let editableTableDummyData = [
  {
    "id":413306978,
    "serial":"",
    "type":"player",
    "calibration":[
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ],
    "txDelay":0,
    "rxDelay":0,
    "calibratedAt":0
  },
  {
    "id":413307175,
    "serial":"",
    "type":"player",
    "calibration":null,
    "txDelay":0,
    "rxDelay":0,
    "calibratedAt":0
  },
  {
    "id":413401289,
    "serial":"",
    "type":"player",
    "calibration":null,
    "txDelay":0,
    "rxDelay":0,
    "calibratedAt":0
  },
  {
    "id":413401388,
    "serial":"",
    "type":"player",
    "calibration":null,
    "txDelay":0,
    "rxDelay":0,
    "calibratedAt":0
  },
  {
    "id":413401207,
    "serial":"",
    "type":"player",
    "calibration":null,
    "txDelay":0,
    "rxDelay":0,
    "calibratedAt":0
  },
  {
    "id":413401210,
    "serial":"",
    "type":"player",
    "calibration":null,
    "txDelay":0,
    "rxDelay":0,
    "calibratedAt":0
  },
  {
    "id":413401215,
    "serial":"",
    "type":"player",
    "calibration":null,
    "txDelay":0,
    "rxDelay":0,
    "calibratedAt":0
  },
  {
    "id":413401214,
    "serial":"",
    "type":"player",
    "calibration":null,
    "txDelay":0,
    "rxDelay":0,
    "calibratedAt":0
  },
  {
    "id":20598,
    "serial":"",
    "type":"player",
    "calibration":null,
    "txDelay":0,
    "rxDelay":0,
    "calibratedAt":0
  },
  {
    "id":20333,
    "serial":"",
    "type":"player",
    "calibration":null,
    "txDelay":0,
    "rxDelay":0,
    "calibratedAt":0
  },
  {
    "id":20332,
    "serial":"",
    "type":"player",
    "calibration":null,
    "txDelay":0,
    "rxDelay":0,
    "calibratedAt":0
  },
  {
    "id":20185,
    "serial":"",
    "type":"player",
    "calibration":null,
    "txDelay":0,
    "rxDelay":0,
    "calibratedAt":0
  },
  {
    "id":20180,
    "serial":"",
    "type":"player",
    "calibration":null,
    "txDelay":0,
    "rxDelay":0,
    "calibratedAt":0
  }
]

let options = [
  {name: "player", value: "player"},
  {name: "anchor", value: "anchor"},
  {name: "ball", value: "ball"}
]

export function getEditableTableDummyData() {
  return editableTableDummyData.map(x => {
    x.serial = base32Encode(x.id)
    x.type = dataTypes.eNum.parse(x.type, options)
    x.color = 'red'
    return x
  })
}

export const editableTableHeaders = [
  {
    "name": "ID",
    "key": "id",
    "type": "text"
  },
  {
    "name": "Serial",
    "key": "serial",
    "type": "text",
    "input": {
      "type": "text"
    }
  },
  {
    "name": "Color",
    "key": "color",
    "type": "text",
    "input": {
      "type": "text"
    },
    color: true
  },
  {
    "name": "Type",
    "key": "type",
    "type": "text",
    "input": {
      "type": "select",
      "selectOptions": options
    }
  },
  {
    "name": "Calibration",
    "key": "calibration",
    "type": "json",
    "input": {
      "type": "text"
    }
  },
  {
    "name": "tx delay",
    "key": "txDelay",
    "type": "number",
    "input": {
      "type": "text"
    }
  },
  {
    "name": "rx delay",
    "key": "rxDelay",
    "type": "number",
    "input": {
      "type": "text"
    }
  },
  {
    "name": "Calibrated at",
    "key": "calibratedAt",
    "type": "text",
    "input": {
      "type": "text"
    }
  }
]

const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

function base32Encode (num) {
  const fiveOnes = 31

  let buffer = []

  // Break the argument into 5-bit bytes, big-end first. Each base 32 digit
  // encodes 5 bits of information. There are 6 5-bit bytes plus 2 bits in a
  // 32 bit unsigned int.
  let bytes = [num >> 30 & fiveOnes, num >> 25 & fiveOnes, num >> 20 & fiveOnes, num >> 15 & fiveOnes, num >> 10 & fiveOnes, num >> 5 & fiveOnes, num >> 0 & fiveOnes]

  // We don't want the base-32 result to be zero-padded, so we'll ignore
  // everything up to the first non-zero value. However, special case: if the
  // input argument is 0, then the result should be "0".
  let firstNonZeroIndex = 6

  // Encode each of the 5-bit bytes into the corresponding base-32 rune.
  for (let i = 0; i < bytes.length; i++) {
    let byte = bytes[i]
    buffer[i] = alphabet[byte]
    if (byte != 0 && firstNonZeroIndex == 6){
      // Keep track of the index of the first non-zero byte so we can
      // slice off the leading zeros at the end.
      firstNonZeroIndex = i
    }
  }

  let array = buffer.slice(firstNonZeroIndex)
  let str = array.join("")
  return str
}