var cliMode = true;
var fs = require("fs");

var ui = {
	clear: function() {},
	log: function(text) {
		console.log("> " + text);
	},

	patches: [],

	checkTweak: function(text) {
		for (var i = 0; i < this.patches.length; i++) {
			if (this.patches[i] == text) {
				return true;
			}
		}

		return false;
	},

	clearInfo: function() {},
	addHeader: function(text) {
		ui.log(text);
	},
	addInfo: function(a, b) {
		ui.log(a);
		ui.log("  " + b);
	}

};

eval(String(fs.readFileSync("./cpp.js")));
eval(String(fs.readFileSync("./keystone-arm.min.js")));

eval(String(fs.readFileSync("./data.js")));
eval(String(fs.readFileSync("./util.js")));
eval(String(fs.readFileSync("./patcher.js")));

if (process.argv.length >= 3) {
	for (var i = 3; i < process.argv.length; i++) {
		ui.patches.push(process.argv[i]);
	}

	firmware.init();
	console.log(process.argv[2]);
	firmwareLoad(process.argv[2]);
	loadDatabase();
	firmware.compile();
	fs.writeFile(process.argv[2] + "_", firmware.result, function(x) {
		console.log("File saved");
	});
}
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
