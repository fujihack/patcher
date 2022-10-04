var ui = {
	info: document.getElementById("info"),

	addHeader: function(text) {
		var p = document.createElement("p");
		p.innerHTML = text;
		p.className = "header";
		this.info.appendChild(p);
	},


	addInfo: function(text, tooltip) {
		var p = document.createElement("P");
		p.innerHTML = text + "<br><i>" + tooltip + "</i>";
		this.info.appendChild(p);
	},

	clearInfo: function() {
		this.info.innerHTML = "";
	},

	tweaks: [
		{
			name: "increment version",
			text: "Increment version by 1.",
			tooltip: "Allows the firmware file to be accepted by the camera.",
			model: null, selected: true
		},
		{
			name: "change shooting menu",
			text: "Change a string",
			tooltip: "Changes the string 'SHOOTING MENU' to 'FujiHacked'. Good as a first test.",
			model: null, selected: false
		},
		{
			name: "printim hack",
			text: "Code Execution After Taking Picture",
			tooltip: "Allows code execution over USB/PTP after taking a picture.",
			model: null, selected: false
		},
		{
			name: "voice memo hack",
			text: "Voice Memo Code Execution",
			tooltip: "Jumps to picture taking hack after you record a voice memo, for when taking a picture isn't possible.",
			model: null, selected: false
		},
		{
			name: "voice memo text fujihack",
			text: "Set Voice Memo Text to 'FujiHack'",
			tooltip: "Set the 'Voice Memo' text to 'FujiHack' because why not.",
			model: null, selected: false
		},
		{
			name: "photo props dbg",
			text: "Fujihack Debugger",
			tooltip: "Replace 'photo properties' popup with FujiHack debugger, which allows code execution.",
			model: null, selected: false
		},
		{
			name: "photo props quick",
			text: "Fujihack Quick PTP",
			tooltip: "No debugger, a fast copy of the PTP hijack into RAM.",
			model: null, selected: false
		},
	],

	tweakElems: [],

	initTweaks: function() {
		var tweaks = document.getElementById("tweaks");
		tweaks.innerHTML = "";

		for (var n = 0; n < this.tweaks.length; n++) {
			var p = document.createElement("P");
	
			var input = document.createElement("INPUT");
			input.type = "checkbox";
			input.checked = this.tweaks[n].selected;
			p.appendChild(input);

			var span = document.createElement("SPAN");
			span.innerHTML = this.tweaks[n].text;
			p.appendChild(span);

			p.appendChild(document.createElement("BR"));

			var i = document.createElement("I");
			i.innerHTML = this.tweaks[n].tooltip;
			p.appendChild(i);

			tweaks.appendChild(p);
			this.tweakElems.push({
				name: this.tweaks[n].name,
				elem: input
			});
		}

		var btn = document.createElement("BUTTON");
		btn.innerText = "Compile patched firmware";
		btn.addEventListener("click", function() {
			firmware.compile();
		});
		tweaks.appendChild(btn);

		var btn = document.createElement("BUTTON");
		btn.innerText = "Export firmware binary";
		btn.addEventListener("click", function() {
			firmware.readable();
		});
		tweaks.appendChild(btn);
	},

	checkTweak: function(name) {
		for (var i = 0; i < this.tweakElems.length; i++) {
			if (this.tweakElems[i].name == name) {
				return this.tweakElems[i].elem.checked;
			}
		}
	},

	log: function(text) {
		var log = document.getElementById("log");
		var span = document.createElement("SPAN");
		span.innerHTML = "> " + text;
		log.appendChild(span);		
	},

	clear: function(text) {
		var log = document.getElementById("log");
		log.innerHTML = "";
	},

	input: document.getElementById("input")
};
