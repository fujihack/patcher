# patcher
JS based patcher uses cpp.js (C Preprocessor) and keystone.js (ARM assembler) to patch  
firmware files and insert assembly code.

Files are loaded in and parsed as an ArrayBuffer, and converted to a Uint8Array  
so it can be patched and saved as a file.
