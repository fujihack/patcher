var cliMode = true;
var fs = require("fs");
var cp = require('child_process')

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

var summary = "";

for (var m = 0; m < fujihack_data.models.length; m++) {
	var cpp = cpp_js(header.settings);
	cpp.run(fujihack_data.models[m].data);

	console.log("---------- Trying " + fujihack_data.models[m].name + " ----------");
	if (cpp.defined("FIRM_URL")) {
		if (cpp.defined("FIRM_PTP_9805")) {
			ui.patches[0] = "direct ptp";
		} else {
			ui.patches[0] = "photo props dbg";
		}

		console.log("" + cp.execSync("curl " + eval(cpp.subs("FIRM_URL")) + " --output FPUPDATE.DAT"));
		firmware.init();
		firmwareLoad("FPUPDATE.DAT");
		header.initFile(fujihack_data.models[m].data);
		try {
			firmware.compile();
			summary += eval(cpp.subs("MODEL_NAME")) + " was successfully compiled with '" + ui.patches[0] + "', checksum 0x" + firmware.header.checksum.toString(16) + "\n";
			cp.execSync("rm -rf FPUPDATE.DAT*");
		} catch(e) {
			console.log(e);
			cp.execSync("rm -rf FPUPDATE.DAT*");
			break;
		}
	}
}

console.log(summary);

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

