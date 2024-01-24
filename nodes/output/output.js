module.exports = function(RED) {

    function OutNode(n) {
        RED.nodes.createNode(this, n)
         
        this.conn = RED.nodes.getNode(n.conn).conn;
        let node = this;
        let statusInterval = null
        let convert = (nv) => {
            if (typeof nv === "boolean") {
                if (nv) {
                    nv = 1;
                } else {
                    nv = 0;
                }
            }
            nv = parseInt(nv);
            let binaryString = "";
            for(let i = 0; i < node.conn.outputData.length; i++) {
                binaryString = ("00000000"+ node.conn.outputData[i].toString(2)).slice(-8) + binaryString
            }

            
            if (Number.isInteger(nv)) {
              nvString = ("0".repeat(n.bitSize)+ nv.toString(2)).slice(-(n.bitSize))
            } else if (!Number.isNaN(nv) && !Number.isInteger(nv))  {
              nvString = floatAsBinaryString(nv, n.bitSize);
            } else {
              console.log("Error: Must use 32 or 64 bit integers")
              return Null
            }

            binaryString = binaryString.substring(0, binaryString.length - n.bitSize - (8 * n.byteOffset) - n.bitOffset) + nvString.toString() + binaryString.substring(binaryString.length - (8 * n.byteOffset) - n.bitOffset, binaryString.length);
            
            for (let j = 0; j < node.conn.outputData.length; j++) {
                node.conn.outputData[j] = parseInt(binaryString.substring(binaryString.length-((j+1)*8),binaryString.length-(j*8)),2)
            }
            
        }

        this.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) };
            convert(msg.payload);
            send(msg)
            if (done) {
                done();
            }
        });

        statusInterval = setInterval(() => {
            if (node.conn.connected) {
                node.status({fill:"green",shape:"dot",text:"connected"});
            } else {
                node.status({fill:"red",shape:"ring",text:"disconnected"});
            }
        }, 10)
        
        this.on('close', () => {
            clearInterval(statusInterval)
        })
    };

    
   
    RED.nodes.registerType("eip-io out", OutNode);

};

function floatAsBinaryString(floatNumber, bitSize) {
  let numberAsBinaryString = '';

  const arrayBuffer = new ArrayBuffer(bitSize/8);
  const dataView = new DataView(arrayBuffer);

  const byteOffset = 0;
  const littleEndian = false;

  if (bitSize/8 === 4) {
    dataView.setFloat32(byteOffset, floatNumber, littleEndian);
  } else if (bitSize/8 === 8){
    dataView.setFloat64(byteOffset, floatNumber, littleEndian);
  } else {
    console.log("ERROR needs to be 32 or 64");
     return Null;
  }

  for (let byteIndex = 0; byteIndex < bitSize/8; byteIndex += 1) {
    let bits = dataView.getUint8(byteIndex).toString(2);
    if (bits.length < 8) {
      bits = new Array(8 - bits.length).fill('0').join('') + bits;
    }
    numberAsBinaryString += bits;
  }

  return numberAsBinaryString;
}
