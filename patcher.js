var firmware = {
	blob: null,

	length: 0,
	buffer: null,

	header: {
		os: null,
		code: null,
		version1: 0,
		version2: 0,
		checksum: 0,
		end: 0
	},

	parseUint32: function(bytes, offset) {
		bytes = new Uint8Array(bytes).slice(offset, offset + 4);
		return new Uint32Array(bytes.buffer)[0];
	},

	load: function(file, callback) {
		if (file.files.length > 1) {
			ui.log("Only select one file.");
			return 1;
		} else if (file.files.length == 0) {
			ui.log("No file selected.");
			return 1;
		}

		length = file.files[0].size;

		var reader = new FileReader();
		this.reader = reader;
		reader.readAsArrayBuffer(file.files[0]);
		reader.onload = function(event) {
			ui.log("Loaded firmware.");
			firmware.buffer = reader.result;
			callback();
		}
	},

	parseCode: function() {
		var split = "";
		for (var i = 1; i < this.header.code.length; i += 2) {
			split += String.fromCharCode(this.header.code[i]);
		}

		for (var i = split.length - 1; i != 0; i--) {
			if (split[i] != '0') {
				return split.slice(0, i + 1);
			}
		}
	},

	parse: function() {
		var header = new Uint8Array(this.reader.result.slice(0, 1024));
		this.header.os = firmware.parseUint32(header, 0);

		var codeSize = 512;
		switch (this.header.os) {
		case 2:
			codeSize = 128;
			break;
		case 3:
		case 4:
		case 5: // Not confirmed yet
		case 6:
			codeSize = 512;
			break;
		default:
			ui.log("Invalid firmware type");
			return 1;
		}
		
		this.header.code = new Uint8Array(header.slice(4, 4 + codeSize))

		this.header.version1 = firmware.parseUint32(header, 4 + codeSize)
		this.header.version2 = firmware.parseUint32(header, 4 + codeSize + 4)
		this.header.checksum = firmware.parseUint32(header, 4 + codeSize + 4 + 4)
		this.header.end = firmware.parseUint32(header, 4 + codeSize + 4 + 4 + 4)

		ui.log("Firmware version is " + this.header.version1.toString(16) + "." + this.header.version2.toString(16));
		ui.log("Firmware checksum is 0x" + this.header.checksum.toString(16));
		ui.log("Model code is " + this.parseCode());
	},
	
	inject: function() {
		
	}
};

function request(url, callback) {
	var requester;
	if (XMLHttpRequest) {
		requester = new XMLHttpRequest;
	} else {
		requester = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	requester.open("GET", url, true);
	requester.onreadystatechange = function() {
		if (requester.readyState == 4 && requester.status == 200) {
			callback(requester.responseText);
		}
	};
	
	requester.send();
}

function grabInfo() {
	request("https://raw.githubusercontent.com/fujihack/patchbuilder/master/data.js", function(data) {
		models = null;
		try {
			models = JSON.parse(data);
		} catch (e) {
			ui.log("Couldn't grab the model database.");
			return;
		}

		code = firmware.parseCode();

		for (var m = 0; m < models.length; m++) {
			if (models[m].code == code) {
				ui.log("This firmware belonds to the '" + models[m].name + "'");
				request("https://raw.githubusercontent.com/fujihack/fujihack/master/model/" + models[m].name + ".h", parseHeader);
				return;
			}
		}

		ui.clearInfo();
		ui.addInfo("No information file found for your model.", "Yet. You can help contribute to the code <a href='https://github.com/fujihack/fujihack'>here</a>: ")
		ui.initTweaks();
	});
}

function parseHeader(data) {
	var settings = { 
		signal_char : '#',
		warn_func : null,
		error_func : null,
		include_func : null,
	}

	var cpp = cpp_js(settings);
	var header = cpp.run(data);

	ui.clearInfo();

	var model = eval(cpp.subs("MODEL_NAME"));

	ui.clearInfo();
	ui.addHeader("Tested Hacks for " + model);

	var hacks = 0;

	if (cpp.defined("CAN_CUSTOM_FIRMWARE")) {
		ui.addInfo("Can Do Custom Firmware", "This model was tested with custom firmware and no problems were reported.");
		hacks++;
	}

	if (cpp.defined("CAN_DO_EXECUTER")) {
		ui.addInfo("Can Do Executor", 
			"This model was tested with the FujiHack USB executor, which allows anything to be run on the camera with little risk.");
		hacks++;
	}

	if (cpp.defined("PRINTIM_HACK_WORKS")) {
		ui.addInfo("PRINTIM Hack Works", "This model was tested with a hack that activates when a picture is taken.")
		hacks++;
	}

	if (cpp.defined("MEMO_HACK_WORKS")) {
		ui.addInfo("Voice Memo Hack Works", "This model was tested with a hack that activates when a voice memo is recorded");
		hacks++;
	}

	if (hacks == 0) {
		ui.addInfo("...", "No hacks were tested on this model. Be careful.");
		hacks++;
	}
}

function load() {
	ui.clear();	
	firmware.load(ui.input, function() {
		firmware.parse();
		grabInfo();
	});
}

load();
