# Fujifilm Firmware patcher
Capabilities:
- Loads and parses firmware files into ArrayBuffer
- Exports firmware payload for dissasembly and examination
- Brute force search and replace patching
- Change firmware version (for upgrade or downgrade)
- Assembles and applies firmware patches in-browser with keystone.js
- Parses model C header files with cpp.js and uses info to patch firmware
- As many sanity checks as possible to prevent any mistakes

Both a web version and Node-based CLI version is available. Firmware is automatically pulled  
and patched in the Github actions workflow to make sure the checksum doesn't change unless when expected.  
