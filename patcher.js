// This assumes little endian

function stringToBytes(string) {
	b = []
	for (var c = 0; c < string.length; c++) {
		b.push(string.charCodeAt(c));
	}

	b.push(0);

	return new Uint8Array(b);
}

function stringToUnicodeBytes(string) {
	b = []
	for (var c = 0; c < string.length; c++) {
		b.push(string.charCodeAt(c));
		b.push(0);
	}

	b.push(0);

	return new Uint8Array(b);
}

function unxor(bytes) {
	b = []
	for (var i = 0; i < bytes.length; i++) {
		b.push(~bytes[i]);
	}

	return new Uint8Array(b);
}

// Like C memcpy, but has an optional offset, so equivelant to:
// memcpy(a + o, b, n);
function memcpy(a, b, n, o) {
	for (var i = 0; i < n; i++) {
		a[i + o] = b[i];
	}
}

// ,With offset for second data
// Will oveflow, but JS likes to return "undefined"
function compareBytes(a, b, n, o) {
	for (var c = 0; c < n; c++) {
		if (a[c] != b[c + o]) {
			return 0;
		}
	}

	return 1;
}

function parseUint32(bytes, offset) {
	bytes = new Uint8Array(bytes).slice(offset, offset + 4);
	return new Uint32Array(bytes.buffer)[0];
}

function bytesUint32(num) {
	var arr = new ArrayBuffer(4);
	var view = new DataView(arr);
	view.setUint32(0, num, true);
	return new Uint8Array(arr);
}

// Extra check
if (parseUint32(bytesUint32(123456), 0) != 123456) {
	document.write("HALT - Endian error");
}

var firmware = {
	init: function() {
		this.version = "";

		this.reader = null;
		this.blob = null;
		this.size = 0;
		this.buffer = null;
		this.result = null;

		this.header = {
			os: null,
			code: null,
			version1: 0,
			version2: 0,
			checksum: 0,
			end: 0,
			size: 0
		};

		this.injections = [];
	},

	// Load as array buffer
	load: function(file, callback) {
		if (file.files.length > 1) {
			ui.log("Only select one file.");
			return 1;
		} else if (file.files.length == 0) {
			return 1;
		}

		this.size = file.files[0].size;

		var reader = new FileReader();
		this.reader = reader;
		reader.readAsArrayBuffer(file.files[0]);
		reader.onload = function(event) {
			ui.log("Loaded firmware.");
			firmware.buffer = reader.result;
			callback();
		}
	},

	// Parse model code in header
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

		// Recognise common header start strings
		if (compareBytes(header, stringToBytes("SUNP BURN FILE"), 14, 0)) {
			ui.log("This firmware is a SUNP burn file. This hack will not work on these cameras. I'm sorry.");
			return 1;
		}

		if (compareBytes(header, stringToBytes("LENGTH"), 6, 0)) {
			ui.log("FujiHack can't work with this firmware type. I'm sorry.");
			return 1;
		}

		this.header.os = parseUint32(header, 0);

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

		this.header.version1 = parseUint32(header, 4 + codeSize)
		this.header.version2 = parseUint32(header, 4 + codeSize + 4)
		this.header.checksum = parseUint32(header, 4 + codeSize + 4 + 4)
		this.header.end = parseUint32(header, 4 + codeSize + 4 + 4 + 4)

		this.header.size = 4 + codeSize + 4 + 4 + 4 + 4;

		this.version = firmware.header.version1.toString(16);
		if (firmware.header.version2 < 16) {
			this.version += 0;
		}
		this.version += firmware.header.version2.toString(16);

		ui.log("Firmware version is " + this.header.version1.toString(16) + "." + this.header.version2.toString(16));
		ui.log("Firmware checksum is 0x" + this.header.checksum.toString(16));
		ui.log("Model code is " + this.parseCode());
	},
	
	inject: function(address, data) {
		this.injections.push({
			address: address,
			data: data
		});
	},

	compile: function() {
		this.result = new Uint8Array(firmware.size);
		var max = 1024;
		var chunks = Math.floor(firmware.size / max);

		for (var chunk = 0; chunk <= chunks; chunk++) {
			var data = new Uint8Array(this.reader.result.slice(chunk * max, chunk * max + max));
			for (var i = 0; i < data.length; i++) {
				this.result[(chunk * max) + i] = data[i];
			}
		}

		var offset = 4 + this.header.code.length + 4;

		if (ui.checkTweak("increment version")) {
			ui.log("Incrementing version by one...")
			memcpy(this.result, bytesUint32(this.header.version2 + 1), 4, offset);
		}

		if (ui.checkTweak("change shooting menu")) {
			ui.log("Looking for SHOOTING MENU...");

			var shootingmenu = stringToUnicodeBytes("SHOOTING MENU");
			var mem = this.search(shootingmenu, shootingmenu.length);

			ui.log("Found it at " + mem.toString(16));

			var newString = stringToUnicodeBytes("FujiHacked!");

			this.inject(mem, newString);

		}

		for (var i = 0; i < this.injections.length; i++) {
			var size = this.injections[i].data.length;

			var checksum1 = 0;
			for (var c = 0; c < size; c++) {
				checksum1 += new Uint8Array([~this.result[this.injections[i].address + c]])[0];
			}

			var checksum2 = 0;
			for (var c = 0; c < size; c++) {
				checksum2 += this.injections[i].data[c];
			}

			console.log(checksum1, checksum2);

			if (checksum1 < checksum2) {
				this.header.checksum -= checksum2 - checksum1;
				ui.log("Subtracted " + String(checksum2 - checksum1) + " from checksum.");
			} else if (checksum1 > checksum2) {
				this.header.checksum += checksum1 - checksum2;
				ui.log("Added " + String(checksum2 + checksum1) + " from checksum.");
			}

			console.log(this.header.checksum.toString(16));

			// Xor injection and copy into firmware
			xored = unxor(this.injections[i].data);
			memcpy(this.result, xored, this.injections[i].data.length, this.injections[i].address);

			// Write modified checksum
			memcpy(this.result, bytesUint32(this.header.checksum), 4, 4 + this.header.code.length + 4 + 4);
		}

		ui.log("<dummy style='color: green;'>Finished patching firmware.</dummy>");

		var a = document.createElement("A");
		a.innerText = "Download patched firmware";
		a.href = window.URL.createObjectURL(new Blob([this.result], {
			type: "application/octet-stream"
		}));
		a.download = "FPUPDATE.DAT";
		document.getElementById("download").appendChild(a);

	},

	// This skips the last >1024 bytes because it makes the code
	// simpler and we most likely will never want to write there
	// anyway
	search: function(search, n) {
		var max = 1024;
		var chunks = Math.floor(firmware.size / max) - 1;

		for (var chunk = 0; chunk <= chunks; chunk++) {
			var data = new Uint8Array(this.reader.result.slice(chunk * max, chunk * max + max));

			data = unxor(data);

			for (var b = 0; b < 1024; b++) {
				if (compareBytes(search, data, n, b)) {
					return (chunk * max) + b;
				}
			}
		}

		return -1;
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

// Load the database file try to find what is available
function loadDatabase() {
	infoFile.init();

	var modelData = fujihack_data.models;

	var code = firmware.parseCode();
	for (var m = 0; m < modelData.length; m++) {
		if (modelData[m].code == code) {
			ui.log("This firmware belonds to the '" + modelData[m].name + "'");
			ui.log("Downloading model information file...");
			request("https://raw.githubusercontent.com/fujihack/fujihack/master/model/" + modelData[m].name + ".h", infoFile.parse);
			return;
		}
	}

	ui.clearInfo();
	ui.addInfo("No information file found for your model.", "Yet. You can help contribute to the code <a href='https://github.com/fujihack/fujihack'>here</a>: ");
}

var infoFile = {
	init: function() {
		this.data = "";
		this.cpp = null;
	}

	settings: { 
		signal_char: '#',
		warn_func: ui.log,
		error_func: ui.log,
		include_func: null
	},

	parse: function(data) {
		this.data = data;
		this.cpp = cpp_js(this.settings);

		var header = this.cpp.run(data);

		ui.clearInfo();

		if (this.cpp.define("MODEL_NAME")) {
			var model = eval(this.cpp.subs("MODEL_NAME"));
		}

		ui.clearInfo();
		ui.addHeader("Tested Hacks for " + model);

		var hacks = 0;

		if (this.cpp.defined("CAN_CUSTOM_FIRMWARE")) {
			ui.addInfo("Can Do Custom Firmware", "This model was tested with custom firmware and no problems were reported.");
			hacks++;
		}

		if (this.cpp.defined("CAN_DO_EXECUTER")) {
			ui.addInfo("Can Do Executor", 
				"This model was tested with the FujiHack USB executor, which allows anything to be run on the camera with little risk.");
			hacks++;
		}

		if (this.cpp.defined("PRINTIM_HACK_WORKS")) {
			ui.addInfo("PRINTIM Hack Works", "This model was tested with a hack that activates when a picture is taken.")
			hacks++;
		}

		if (this.cpp.defined("MEMO_HACK_WORKS")) {
			ui.addInfo("Voice Memo Hack Works", "This model was tested with a hack that activates when a voice memo is recorded");
			hacks++;
		}

		if (hacks == 0) {
			ui.addInfo("...", "No hacks were tested on this model. Be careful.");
			hacks++;
		}
	}
}

function assemble(file, base) {
	var a = new ks.Keystone(ks.ARCH_ARM, ks.MODE_LITTLE_ENDIAN);
	var cpp = cpp_js(infoFile.settings);
	var processed = cpp.run(infoFile.file + file);

	var code;
	try {
		code = a.asm(processed, base);
	} catch (err) {
		ui.log(err);
		ui.log("Error assembling code.");
		return 1;
	}

	return code;
}

function load() {
	firmware.init();
	firmware.load(ui.input, function() {
		if (firmware.parse() == 1) {
			return 1;
		}

		ui.initTweaks();

		loadDatabase();
	});
}

load();
