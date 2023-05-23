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
