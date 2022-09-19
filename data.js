var fujihack_data = {
    "files": {
        "jump.S": "// Code to jump to MEM_DUMP_ADDR when the injection trigger\n// function is too small for main.S\n\n// Define stubs.h for a small message\n\n.global _start\n_start:\n\tpush {r1, r2, r3, r4, r5, r6, r7, r8, lr}\n\n\tadr r4, addr\n\tldr r4, [r4]\n\tbx r4\n\n\tpop {r1, r2, r3, r4, r5, r6, r7, r8, pc}\n\taddr: .int MEM_DUMP_ADDR\n",
        "main.S": "// Main code execution hacks - allows code to be loaded in via USB, see src/\n// Tested: XF-1\n\n// This copies a part of itself above the get_thumb PTP function, allowing\n// a basic RAM copying interface between over USB. It hijacks the function\n// header, jumps to the code above, and then returns back, hoping that\n// it preserved everything correctly for the original code.\n\n// This section is copied into the firmware on compile time,\n// preferably by the PrintIM hack.\n.global _start\n_start:\n\tpush {r4, r5, r6, r7, r8, lr}\n\n\t// The \"top\" loop carefully copies instructions starting from\n\t// \"hack\" up to the top of this file into the PTP code. That means\n\t// it will probably copy in extra instructions, but I don't care.\n\n\tldr r4, =MEM_PTP_THUMBNAIL\n\tadr r6, hack\n\tmov r5, #35 // how many insts to copy\n\n\ttop:\n\t\tldr r7, [r6]\n\t\tstr r7, [r4]\n\t\tsub r4, #4\n\t\tsub r6, #4\n\n\t\tsub r5, #1\n\t\tcmp r5, #0\n\tbne top\n\n\tpop {r4, r5, r6, r7, r8, pc}\n\n// Everything from here on out is code\n// that will be copied into a PTP function\n// The bottom part hijacks the target function\n// header, and the custom code overwrites a\n// some other PTP function (doesn't seem to crash though)\ntemp_addr: .long MEM_FREE_SPACE // Used for incrementing\nput_addr: .long MEM_FREE_SPACE // unchanged, copied into put_addr\ncustom:\n\t// r0 is #0 when returning the PTP header\n \t// #1 is used for the actual PTP command\n\tcmp r0, #1\n\tbne nohack\n\n\tldr r6, [r1, #0x10] // get first PTP parameter from r1\n\tldr r5, [r1, #0x14] // get second parameter\n\n\t// Problems with sending zero to PTP,\n\t// command #4 will be used to write it\n\tcmp r6, #4\n\tbne h\n\t\teor r5, r5, r5 // reset register\n\t\tmov r5, #0 // reset register again for some reason\n\t\tmov r6, #5 // set action to #5, write byte\n\th:\n\n\t// #5 - write byte\n\tcmp r6, #5\n\tbne n1\n\t\tadr r9, put_addr\n\t\tldr r8, [r9]\n\t\tstrb r5, [r8]\n\t\tadd r8, #1\n\t\tstr r8, [r9]\n\tn1:\n\n\t// #6 - run code\n\tcmp r6, #6\n\tbne n2\n\t\tadr r9, temp_addr\n\t\tldr r9, [r9]\n\t\tblx r9\n\tn2:\n\n\t// #7 - reset address\n\tcmp r6, #7\n\tbne n3\n\t\tadr r8, put_addr\n\t\tadr r9, temp_addr\n\t\tldr r9, [r9]\n\t\tstr r9, [r8]\n\tn3:\n\n\tnohack:\n\tmov r6, r1\n\tb return\n\n\t// Copy in exact function, but replace the \"mov r6, r1\"\n\t// with a jump to above \n\tpush {r4, r5, r6, r7, r8, sl, fp, lr}\n\tadd r11, sp, #0x1c\n\tsub sp, sp, #0x1c\nhack:\n\tb custom\nreturn:"
    },
    "models": [
        {
            "code": "62306231623262336234623562366237623862397382",
            "jump": "",
            "main": "",
            "name": "hs20exr_104"
        },
        {
            "code": "00030011000300120003001400030019",
            "jump": "",
            "main": "",
            "name": "xa1_150"
        },
        {
            "code": "000192710001927200019273000192740001927500019276000192770001927800019279000192810001928200019286",
            "jump": "",
            "main": "",
            "name": "xf1_101"
        },
        {
            "code": "0005100100051002000510040005100500051007000510090005101",
            "jump": "",
            "main": "",
            "name": "xt10_131"
        },
        {
            "code": "00053661000536620005366400053665000536670005367000053669",
            "jump": "",
            "main": "",
            "name": "xt20_210"
        },
        {
            "code": "",
            "jump": "",
            "main": "",
            "name": "xt4_150"
        },
        {
            "code": "1109111011121113111411151116",
            "jump": "",
            "main": "",
            "name": "z3_102"
        }
    ]
};