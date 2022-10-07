var cliMode = true;
var fs = require("fs");

var ui = {
	clear: function() {},
	log: function(text) {
		console.log("> " + text);
	}
};

eval(String(fs.readFileSync("./data.js")));
eval(String(fs.readFileSync("./util.js")));
eval(String(fs.readFileSync("./patcher.js")));

firmware.init();
firmwareLoad("/home/daniel/Downloads/FPUPDATE.DAT");


function firmwareLoad(filename) {
	// Copy file data into arraybuffer
	var fileData = fs.readFileSync(filename);
	firmware.size = fileData.length;

	var buffer = new ArrayBuffer(fileData.length);

	// Emulate a FileReader
	firmware.reader = {result: buffer};

	var pointer = new Uint8Array(buffer);
	for (var i = 0; i < fileData.length; i++) {
		pointer[i] = fileData[i];
	}
	
	firmware.parse();
}
