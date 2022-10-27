var fujihack_data = {
    "files": {
        "debug.S": "// This is a debugger program that is applied into\n// the show_photo_properties function (most cameras 2009-2017)\n// Since this function is 4k long, we aren't as restricted on\n// code size.\n\n.global _dbg_patch\n_dbg_patch:\n\tpush {r1-r10, fp, lr}\n\n\t// Initialize rasterizer rendering configs\n\t// Not exactly necessary\n\t// Might be able to tweak to be transparent, or different colors\n\tmov r0, #0xf\n\tbl FIRM_RST_CONFIG1\n\tmov r0, #0xd\n\tbl FIRM_RST_CONFIG2\n\n\t// Switch curr iteration\n\tldr r0, iteration\n\tcmp r0, #0x0\n\tbeq i_txt\n\tcmp r0, #0x1\n\tbeq i_search\n\tcmp r0, #0x2\n\tbeq i_hijack\n\tcmp r0, #0x3\n\tbeq i_end\n\tb i_increment\n\n\ti_increment:\n\tldr r1, iteration\n\tadd r1, #0x1\n\tadr r0, iteration\n\tstr r1, [r0]\n\n\ti_end:\n\tpop {r1-r10, fp, pc}\n\ni_txt:\n\tmov r0, #0x1\n\tmov r1, #0x1\n\tadr r2, fh_intro\n\tbl FIRM_RST_WRITE\nb i_increment\n\ni_search:\n\t// Find\n\tadr r0, search_ptp\n\tmov r1, #0x4\n\tadr r3, bruteForceSearch\n\tblx r3\n\n\tcmp r0, #0x0 // check err\n\tbeq i_search_err\n\tadr r3, findFuncHeader\n\tblx r3\n\n\t// Store\n\tadr r1, search_ptp\n\tstr r0, [r1]\n\n\t// Print\n\tadr r1, buffer\n\tadr r3, intToBuffer\n\tblx r3\n\tmov r0, #0x1\n\tmov r1, #0x1\n\tadr r2, buffer\n\tbl FIRM_RST_WRITE\n\n\t// Find\n\tadr r0, search_ptp_finish\n\tmov r1, #0x4\n\tadr r3, bruteForceSearch\n\tblx r3\n\tcmp r0, #0x0\n\tbeq i_search_err\n\tadr r3, findFuncHeader\n\tblx r3\n\n\t// Store\n\tadr r1, search_ptp_finish\n\tstr r0, [r1]\n\n\t// Print\n\tadr r1, buffer\n\tadr r3, intToBuffer\n\tblx r3\n\n\tmov r0, #0x1\n\tmov r1, #0x3\n\tadr r2, buffer\n\tbl FIRM_RST_WRITE\nb i_increment\n\ni_search_err:\n\tmov r0, #0x1\n\tmov r1, #0x4\n\tadr r2, search_err\n\tbl FIRM_RST_WRITE\nb i_quit\n\ni_hijack:\n\t// Store permanent address for code loading (after this file)\n\t// This must be done before everything is copied\n\tadr r1, _dbg_patch_end\n\tadr r2, perm_addr\n\tstr r1, [r2]\n\n\tldr r2, search_ptp\n\tadr r3, _ptp_9805_hack\n\tmov r1, #0x0\n\ti_h:\n\t\tldr r4, [r3, r1]\n\t\tstr r4, [r2, r1]\n\t\tadd r1, #0x4\n\t\tcmp r1, #(65 * 4) // about 65 instructions, plus the data under the code\n\t\tbne i_h\n\n\tmov r0, #0x1\n\tmov r1, #0x1\n\tadr r2, success\n\tbl FIRM_RST_WRITE\nb i_quit\n\ni_quit:\n\tadr r1, iteration\n\tmov r2, #0x3\n\tstr r2, [r1]\n\tb i_end\n\n// GCC -O4 was better at optimizing this, this is from Godbolt\n// uintptr_t bruteForceSearch(uint8_t *bytes, int length)\n.global bruteForceSearch\nbruteForceSearch:\n\tpush    {r4, r5, r6, r7, lr}\n\tmov     r5, r0\n\tsub     r4, r1, #1\n\trsb     r7, r0, #0\n\tadd     r4, r5, r4\n\tmov     r0, #0\n\t.L6:\n\tcmp     r0, r5\n\tbeq     .L2\n\tldrb    r2, [r5]        @ zero_extendqisi2\n\tldrb    r3, [r0]        @ zero_extendqisi2\n\tcmp     r2, r3\n\tbne     .L2\n\tcmp     r1, #1\n\tpopeq   {r4, r5, r6, r7, pc}\n\tmov     r3, r5\n\tb       .L4\n\t.L5:\n\tcmp     r3, r4\n\tpopeq   {r4, r5, r6, r7, pc}\n\t.L4:\n\tldrb    r6, [r3, #1]!   @ zero_extendqisi2\n\tldrb    r2, [r3, r7]    @ zero_extendqisi2\n\tcmp     r6, r2\n\tbeq     .L5\n\t.L2:\n\tadd     r0, r0, #1\n\tcmp     r0, #0x02000000\n\tadd     r7, r7, #1\n\tbne     .L6\n\tmov     r0, #0\n\tpop     {r4, r5, r6, r7, pc}\n\n// uintptr_t findFuncHeader(uintptr_t addr)\n.global findFuncHeader\nfindFuncHeader:\n\tpush {r1, lr}\n\t\tffh:\n\t\tsub r0, r0, #0x4\n\t\tldrb r1, [r0, #0x2]\n\t\tcmp r1, #0x2d\n\t\tbne ffh\n\tpop {r1, pc}\n\n#include \"int.S\"\n\n// ptp.S will access search_ptp and search_ptp_finish\n// locally, so that data must follow below to be copied\n#define PTP_ABSOLUTE\n#include \"ptp.S\"\n\n// movw r2, #0xa808\n.align 4\n.global search_ptp\nsearch_ptp: .byte 0x8, 0x28, 0xa, 0xe3\n\n// add r2, r3, #0x7000\n.align 4\nsearch_ptp_finish: .byte 0x7, 0x2a, 0x83, 0xe2\n\n.align 4\niteration: .int 0x0\n\n.align 4\nfh_intro: .string \"FujiHack DBG\"\n\n.align 4\nsearch_err: .string \"Failed\"\n\n.align 4\nsuccess: .string \"Hacked\"\n\n// After here is both used as code and string buffer,\n// after it is used as code, it should not be used as buffer anymore\n.align 4\nbuffer:\n_dbg_patch_end:\n",
        "file.S": "// This code is ran in preview menu\n\n#define MAX_SIZE 0x100000\n\n.global _file_loader\n_file_loader:\n\tpush {r0, r1, r2, r3, r4, r5, r6, r7, r8, lr}\n\n\t// r8 = sqlite_malloc(MAX_SIZE)\n\tbl fuji_init_sqlite\n\tmov r0, #0x100000\n\tbl sqlite_malloc\n\tmov r8, r4\n\n\t// file[0] = fuji_drive();\n\tadr r1, file\n\tbl fuji_drive\n\tstrb r0, [r1]\n\n\t// filep = fuji_fopen(FUJI_FOPEN_HANDLER, file, 1)\n\tbl fuji_toggle\n\tldr r0, =FUJI_FOPEN_HANDLER\n\tadr r1, file\n\tmov r2, #0x1\n\tbl fuji_fopen\n\tadr r1, filep\n\tstr r0, [r1]\n\tbl fuji_toggle\n\n\tbl fuji_zero\n\n\t// fread(FUJI_FREAD_HANDLER, filep, MAX_SIZE, r8)\n\tbl fuji_toggle\n\tldr r0, =FUJI_FREAD_HANDLER\n\tadr r1, file\n\tmov r2, #MAX_SIZE // size\n\tmov r3, r8 // set to alloc'd addr\n\tbl fuji_fread\n\tbl fuji_toggle\n\n\tbl fuji_zero\n\n\t// fuji_fclose(FUJI_FCLOSE_HANDLER, filep, 0x0, 0x0)\n\tbl fuji_toggle\n\tldr r0, =FUJI_FCLOSE_HANDLER\n\tadr r1, file\n\tmov r2, #0x0\n\tmov r3, #0x0\n\tbl fuji_fread\n\tbl fuji_toggle\n\n\tbl fuji_zero\n\n\t// fuji_screen_write(run_fujihack, 1, 1, 0, 7)\n\tadr r0, run_fujihack\n\tmov r1, #0x1\n\tmov r2, #0x1\n\tmov r3, #0x0\n\tmov r4, #0x7\n\tbl fuji_screen_write\n\n\tblx r8\n\n\t// fuji_screen_write(press_ok, 1, 2, 0, 7)\n\tadr r0, press_ok\n\tmov r1, #0x1\n\tmov r2, #0x2\n\tmov r3, #0x0\n\tmov r4, #0x7\n\tbl fuji_screen_write\n\n\tbl fuji_screen_clear\n\n\texit:\n\tpop {r0, r1, r2, r3, r4, r5, r6, r7, r8, pc}\nfilep: .int 0x0\nrun_once: .byte 0x0\n.align 4\nfile: .string \"X:\\\\FH.BIN\"\nrun_fujihack: .string \"Run FujiHack..\"\npress_ok: .string \"Press OK\"\nbxlr: bx lr\n",
        "int.S": "// Converts int to str codes in only ~100 bytes,\n// see etc/ab-int.c\n\n#define INT_C1 'A'\n#define INT_C2 'Z'\n\n// intToBuffer(int x, void *buf)\n.global intToBuffer\nintToBuffer:\n\tpush {r0-r6, lr}\n\tmov r6, r1\n\tadr r1, temp_int\n\tstr r0, [r1]\n\n\tmov r4, #0x0 // curr byte\n\tmov r5, #0x0 // buffer byte\n\n\tsib_top_1:\n\t\tldrb r0, [r1, r4] // curr byte\n\t\tmov r2, #INT_C1 // a\n\t\tmov r3, #INT_C1 // b\n\t\tsib_top:\n\t\t\tcmp r0, #0x0 // is byte finished?\n\t\t\tbeq sib_end\n\t\t\tcmp r3, #INT_C2 // end of b?\n\t\t\tbne sib_1\n\t\t\tadd r2, #0x1 // decrement a\n\t\t\tmov r3, #INT_C1 // reset b\n\t\t\tsib_1:\n\t\t\tadd r3, #0x1\n\t\t\tsub r0, #0x1 // dec main value\n\t\tb sib_top\n\t\tsib_end:\n\t\tstrb r2, [r6, r5]\n\t\tadd r5, #0x1\n\t\tstrb r3, [r6, r5]\n\t\tadd r5, #0x1\n\n\t\tadd r4, #0x1 // inc byte\n\t\tcmp r4, #0x3 // is curr byte over 4?\n\t\tble sib_top_1\n\tmov r2, #0x0 // null terminator\n\t//sub r5, #0x2\n\tstrb r2, [r6, r5]\n\tpop {r0-r6, pc}\n\ntemp_int: .int 0x0\n",
        "jump.S": "// Code to jump to MEM_DUMP_ADDR when the injection trigger\n// function is too small for main.S\n\n.global _start\n_start:\n\tpush {r1, r2, r3, r4, r5, r6, r7, r8, lr}\n\n\tadr r4, addr\n\tldr r4, [r4]\n\tbx r4\n\n\tpop {r1, r2, r3, r4, r5, r6, r7, r8, pc}\n\taddr: .int MEM_DUMP_ADDR\n",
        "old.S": "// Main code execution hacks - allows code to be loaded in via USB, see src/\n\n// This copies a part of itself above the get_thumb PTP function, allowing\n// a basic RAM copying interface between over USB. It hijacks the function\n// header, jumps to the code above, and then returns back, hoping that\n// it preserved everything correctly for the original code.\n\n// This section is copied into the firmware once, on compile time,\n// preferably by the PrintIM hack.\n.global _start\n_start:\n\tpush {r4, r5, r6, r7, r8, lr}\n\n\t// The \"top\" loop carefully copies instructions starting from\n\t// \"hack\" up to the top of this file into the PTP code. That means\n\t// it will probably copy in extra instructions, but I don't care.\n\n\tldr r4, =MEM_PTP_THUMBNAIL\n\tadr r6, hack\n\tmov r5, #35 // how many insts to copy\n\n\ttop:\n\t\tldr r7, [r6]\n\t\tstr r7, [r4]\n\t\tsub r4, #4\n\t\tsub r6, #4\n\n\t\tsub r5, #1\n\t\tcmp r5, #0\n\tbne top\n\n\tpop {r4, r5, r6, r7, r8, pc}\n\n// Everything from here on out is code\n// that will be copied into a PTP function\n// The bottom part hijacks the target function\n// header, and the custom code overwrites a\n// some other PTP function (doesn't seem to crash though)\ntemp_addr: .long MEM_FREE_SPACE // Used for incrementing\nput_addr: .long MEM_FREE_SPACE // unchanged, copied into put_addr\ncustom:\n\t// r0 is #0 when returning the PTP header\n \t// #1 is used for the actual PTP command\n\tcmp r0, #1\n\tbne nohack\n\n\tldr r6, [r1, #0x10] // get first PTP parameter from r1\n\tldr r5, [r1, #0x14] // get second parameter\n\n\t// Problems with sending zero to PTP,\n\t// command #4 will be used to write it\n\tcmp r6, #4\n\tbne h\n\t\teor r5, r5, r5 // reset register\n\t\tmov r5, #0 // reset register again for some reason\n\t\tmov r6, #5 // set action to #5, write byte\n\th: \n\n\t// #5 - write byte\n\tcmp r6, #5\n\tbne n1\n\t\tadr r9, put_addr\n\t\tldr r8, [r9]\n\t\tstrb r5, [r8]\n\t\tadd r8, #1\n\t\tstr r8, [r9]\n\tn1:\n\n\t// #6 - run code\n\tcmp r6, #6\n\tbne n2\n\t\tadr r9, temp_addr\n\t\tldr r9, [r9]\n\t\tblx r9\n\tn2:\n\n\t// #7 - reset address\n\tcmp r6, #7\n\tbne n3\n\t\tadr r8, put_addr\n\t\tadr r9, temp_addr\n\t\tldr r9, [r9]\n\t\tstr r9, [r8]\n\tn3:\n\n\tnohack:\n\tmov r6, r1\n\tb return\n\n\t// Copy in exact function, but replace the \"mov r6, r1\"\n\t// with a jump to above \n\tpush {r4, r5, r6, r7, r8, sl, fp, lr}\n\tadd r11, sp, #0x1c\n\tsub sp, sp, #0x1c\nhack:\n\tb custom\nreturn:\n",
        "ptp.S": "// 0x9805 Hijack - Allows code execution / debugging\n\n\n.extern search_ptp\n.extern search_ptp_finish\n\n#define PTP_CMD_ZERO 0x4\n#define PTP_CMD_WRITE 0x5\n#define PTP_CMD_RUN 0x6\n#define PTP_CMD_RESET 0x7\n#define PTP_CMD_SETADDR 0x8\n#define PTP_CMD_GET 0x9\n\n.global _ptp_9805_hack\n_ptp_9805_hack:\n\tpush {r1-r10, lr}\n\tcmp r0, #0x1\n\tbne ptp_end\n\n\tldr r0, [r1, #(0x10)] // param 1\n\tldr r3, [r1, #(0x14)] // param 2\n\n\t// Set first param to zero\n\tadr r5, pk_param1\n\tmov r6, #0x0\n\tstr r6, [r5]\n\n\t// PTP parameters can't be zero, a custom cmd\n\t// must be made to send zeros\n\n\tcmp r0, #PTP_CMD_ZERO // operation 4 is zero\n\tbne not_zero\n\t\tmov r3, #0x0 // set to zero\n\t\tmov r0, #5 // set to write operation\n\tnot_zero:\n\n\t// #5 write byte\n\tcmp r0, #PTP_CMD_WRITE\n\tbne not_5\n\t\tadr r5, temp_addr\n\t\tldr r6, [r5]\n\t\tstrb r3, [r6] // store byte in mem\n\t\tadd r6, #1\n\t\tstr r6, [r5] // write counter\n\tnot_5:\n\n\t// #6 - Run code\n\tcmp r0, #PTP_CMD_RUN\n\tbne not_6\n\t\tldr r5, perm_addr\n\t\tblx r5 // expected to not modify r1\n\t\tb ptp_end // r0 may be modified\n\tnot_6:\n\n\t// #7 - Reset addr\n\tcmp r0, #PTP_CMD_RESET\n\tbne not_7\n\t\tadr r5, temp_addr\n\t\tldr r6, perm_addr\n\t\tstr r6, [r5]\n\tnot_7:\n\n\t// #8 - Set addr\n\tcmp r0, #PTP_CMD_SETADDR\n\tbne not_8\n\t\tadr r6, perm_addr\n\t\tstr r3, [r6]\n\tnot_8:\n\n\t// #9 - Get 32 bit from RAM\n\tcmp r0, #PTP_CMD_GET\n\tbne not_9\n\t\tldr r5, [r3] // get uint32_t at param r3\n\t\tadr r6, pk_param1\n\t\tstr r5, [r6]\n\tnot_9:\n\n\tptp_end:\n\tmov r0, #0x2000 // OK return code\n\tadd r0, #0x1\n\toverride_ret_code:\n\tadr r1, pk_code\n\tstr r0, [r1]\n\n\tadr r0, return_packet\n\tmov r1, #0x0\n#ifdef PTP_ABSOLUTE\n\tldr r5, search_ptp_finish\n\tblx r5\n#else\n\tbl FIRM_PTP_FINISH\n#endif\t\n\n\tpop {r1-r10, pc}\n\n.global perm_addr\ntemp_addr: .int 0x0\nperm_addr: .int 0x0\n\nreturn_packet:\npk_code: .int 0x2001\npk_transid: .int 0x0 // zero is fine\npk_sessionid: .int 0x0 // same here\npk_nparams: .int 0x1\npk_param1: .int 0x0\n\n// An option for area in which to load code\n_ptp_hack_end:\n",
        "quick.S": "// Quicker/smaller version of FujiHack DBG\n.global _quick_ptp\n_quick_ptp:\n\tpush {r1-r10, fp, lr}\n\n\tmov r0, #0xf\n\tbl FIRM_RST_CONFIG1\n\tmov r0, #0xd\n\tbl FIRM_RST_CONFIG2\n\n\t// Change permanent address for code loading (after this file)\n\t// This must be done before everything is copied\n\tadr r1, _quick_ptp_end\n\tadr r2, perm_addr\n\tstr r1, [r2]\n\n\tldr r1, search_ptp\n\tadr r2, _ptp_9805_hack\n\tmov r3, #0x0\n\tctop:\n\t\tldr r4, [r2, r3]\n\t\tstr r4, [r1, r3]\n\t\tadd r3, #0x4\n\t\tcmp r3, #(65 * 4)\n\t\tbne ctop\n\n\tmov r0, #0x1\n\tmov r1, #0x1\n\tadr r2, hacked\n\tbl FIRM_RST_WRITE\n\n\tmov r0, #0x0\n\tpop {r1-r10, fp, lr}\n\n.align 4\nhacked: .string \"Fuji Hacked\"\n\n#define PTP_ABSOLUTE\n.align 4\n#include \"ptp.S\"\n\n.align 4\nsearch_ptp: .int MEM_PTP_9805\n\n.align 4\nsearch_ptp_finish: .int MEM_PTP_RETURN\n\n_quick_ptp_end:\n"
    },
    "models": [
        {
            "data": "/*\nFujifilm X-A2\nMirrorless\nReleased March 2015\nhttps://en.wikipedia.org/wiki/Fujifilm_X-A2\n*/\n\n#define MODEL_NAME \"Fujifilm X-A2\"\n#define MODEL_CODE \"00050701000507020005070400050709\"\n#define CODE_ARM\n\n#define S3_FILE \"C:\\\\IMFIDX10\\\\LX30B.S3\"\n\n#define FIRM_IMG_PROPS 0x01553b1b\n#define FIRM_IMG_PROPS_MAX 2000\n\n#ifdef STUBS\n\t#include \"stub.h\"\n\n\t//NSTUB(show_photo_properties, 0x01553b1b) // firm stub or RAM stub???\n#endif\n",
            "file": "",
            "name": "xa2_130"
        },
        {
            "data": "#define MODEL_NAME \"Fujifilm X-T4\"\n",
            "file": "",
            "name": "xt4_150"
        },
        {
            "data": "/*\nhttps://dl.fujifilm-x.com/support/firmware/x-pro1-382-9cy17ibx/FPUPDATE.DAT\n*/\n\n#define MODEL_NAME \"Fujifilm X-Pro1\"\n#define MODEL_CODE \"000102410001024200010244000102450001024600010247000102480001024900010255\"\n#define FIRM_URL \"https://dl.fujifilm-x.com/support/firmware/x-pro1-382-9cy17ibx/FPUPDATE.DAT\"\n\n#define FIRM_IMG_PROPS 0x00479004\n#define FIRM_RST_CONFIG1 0x004725bc\n#define FIRM_RST_CONFIG2 0x0049d298\n#define FIRM_RST_WRITE 0x0047364c\n#define FIRM_IMG_PROPS_MAX 3000\n\n#ifdef STUBS\n\t#include \"stub.h\"\n#endif\n",
            "file": "",
            "name": "xpro1_382"
        },
        {
            "data": "#define MODEL_NAME \"Fujifilm X-T2\"\n#define MODEL_CODE \"00053101000531020005310400053105000531070005311000053109\"\n",
            "file": "",
            "name": "xt2_440"
        },
        {
            "data": "/*\nThis is an information file for the Fujifilm HS20EXR.\n*/\n\n// Custom firmware seems to work (Just reverse a word in FPUPDATE.DAT)\n#define CAN_CUSTOM_FIRMWARE\n\n// Can inject and execute code in the printim function\n#define PRINTIM_HACK_WORKS\n\n#define MODEL_NAME \"Fujifilm HS20EXR\"\n#define MODEL_CODE \"62306231623262336234623562366237623862397382\"\n\n#define MEM_STRNCPY 0x001e1af8\n#define MEM_SUBTRING 0x001e1af8\n#define MEM_STRNCMP 0x001e1e38\n\n// Prints some text into an image when\n// it is taken. Around 400 bytes long.\n#define FIRM_PRINTIM 0x0040674c\n\n#define MEM_START 0x00db6568 - 10000\n#define TEXT_START 0x0074e5b0 - 10000\n\n#define MEM_EEP_START 0x4138a1c0\n\n// Empty area is larger than offset, so\n// we will just put in the offset instead\n#define COPY_LENGTH MEM_START - TEXT_START\n",
            "file": "",
            "name": "hs20exr_104"
        },
        {
            "data": "/*\nFujifilm X-T10\n\n*/\n\n#define MODEL_NAME \"Fujifilm X-T10\"\n#define MODEL_CODE \"0005100100051002000510040005100500051007000510090005101\"\n\n// Code triggered when a picture is taken\n#define FIRM_TAKEPIC 0x0096cc80\n\n// PTP/USB Code\n#define FIRM_PTP 0x01e7c718\n\n/*\n\nX-T10 has 3 sets of strings that are loaded seperately\nduring the firmware update. To identify them, I referred\nto HS20EXR code, which has all strings loaded in one place.\n\nFirst string copy, for SQLite code.\n\n*/\n\n// Where the code that references \"out of memory\" is\n#define OUT_OF_MEMORY_CODE 0x00bd8954\n\n// Location where code thinks \"out of memory\" is\n#define OUT_OF_MEMORY_REF 0x1f54c3c\n\n// Where \"out of memory\" actually resides, in the\n// file that dump.c generates\n#define OUT_OF_MEMORY_REAL 0x00bf4c84\n\n#define MEM_START OUT_OF_MEMORY_REF - 10000\n#define TEXT_START OUT_OF_MEMORY_REAL - 10000\n#define COPY_LENGTH 10000 + 6052\n\n/*\n\nSecond string copy needed.\n\nWhere fw thinks \"OSD DEBUG MODE SCREEN SELECT\" is: 0x01b59bd4\nWhere it actually is:                              0x007f9c1c\n\n*/\n\n#define MEM_START2 0x01b59bd4 - 4960\n#define TEXT_START2 0x007f9c1c - 4960\n#define COPY_LENGTH2 79024 + 4960\n\n/*\n\nYet another string copy needed...\n\nWhere fw thinks \"PrintIM\" is: 0x01cd6de8\nWhere \"PrintIM\" actually is:  0x00976e30\n\n*/\n\n#define MEM_START3 0x01cd6de8 - 431\n#define TEXT_START3 0x00976e30 - 431\n#define COPY_LENGTH3 0x281a30\n",
            "file": "",
            "name": "xt10_131"
        },
        {
            "data": "/*\nFujifilm X-F1\nMirrorless fixed lens\n\n*/\n\n#define MODEL_NAME \"Fujifilm XF-1\"\n#define MODEL_CODE \"000192710001927200019273000192740001927500019276000192770001927800019279000192810001928200019286\"\n#define FIRM_URL \"https://dl.fujifilm-x.com/support/firmware/xf1YbzzDmLK/FPUPDATE.DAT\"\n#define CODE_ARM // no thumb\n\n// Confirmed tests:\n#define CAN_DO_EXECUTER\n#define CAN_CUSTOM_FIRMWARE\n#define PRINTIM_HACK_WORKS\n#define MEMO_HACK_WORKS\n#define IMG_PROPS_HACK_WORKS\n\n#define FIRM_IMG_PROPS 0x00485258\n#define FIRM_IMG_PROPS_MAX 4000\n#define FIRM_RST_WRITE 0x0049aaa4\n#define FIRM_RST_CONFIG1 0x0047a74c\n#define FIRM_RST_CONFIG2 0x004a3b80\n\n// Code that writes \"PrintIM\" to JPEG images. A safe place\n// To execute code.\n#define FIRM_PRINTIM 0x00516c90\n#define FIRM_PRINTIM_MAX 236\n\n// Injection details for \"voice memo\" feature\n#define FIRM_MEMO 0x0063fe20\n#define FIRM_MEMO_MAX 100\n\n// FH debugger searches for this\n#define MEM_PTP_9805 0x00e52c00\n#define MEM_PTP_RETURN 0x00e507c0\n\n// fujifilm.co.jp; text printed by PTP GetDeviceInfo\n#define MEM_PTP_TEXT 0x00e5e228\n\n// Where \"corrupted\" firmware data starts\n#define MEM_CRYPT_START 0x96b10c0\n#define FIRM_CRYPT_START 0x001c8048\n\n// Where unencrypted firmware data starts\n#define MEM_FIRM_START 0xda30e5\n\n// EEPRom data\n#define MEM_EEP_START 0x409a7e00\n\n// TODO: screen buffer addrs seems to be accessible\n// from 0x008c9b9c\n\n// \"Seems to work\" screen buffer\n#define SCREEN_WIDTH 640\n#define SCREEN_HEIGHT 480\n#define MEM_SCREEN_BUFFER 0x01cebe00\n#define GET_SCREEN_LAYER(x) (MEM_SCREEN_BUFFER + (SCREEN_WIDTH * SCREEN_HEIGHT * 4) * x)\n//#define GET_SCREEN_LAYER(x) \n\n#define MEM_DEV_FLAG 0x007a117c\n#define MEM_DEV_MODE 0x007a7250\n\n#define FUJI_FOPEN_HANDLER 0x00fd45b4\n#define FUJI_FWRITE_HANDLER 0x00fd462c\n#define FUJI_FREAD_HANDLER 0x00e8e754\n#define FUJI_FCLOSE_HANDLER 0x00fd45dc\n\n#define MEM_INPUT_MAP 0x00795370\n\n#define MEM_SQLITE_STRUCT 0x0144c670\n\n#ifdef STUBS\n\t#include \"stub.h\"\n\n\tNSTUB(fuji_drive, 0x0072db0c)\n\n\tNSTUB(fuji_fopen, 0x0072b87c)\n\tNSTUB(fuji_fread, 0x0072b618)\n\tNSTUB(fuji_fwrite, 0x0072b428)\n\tNSTUB(fuji_fclose, 0x0072b250)\n\n\t//NSTUB(fuji_malloc, 0x0073a2cc)\n\n\tNSTUB(fuji_toggle, 0x00fd5a1c)\n\tNSTUB(fuji_zero, 0x00fd4590)\n\n\t//NSTUB(fuji_create_fixedmemory, 0x0073a4f4)\n\n\tNSTUB(fuji_init_sqlite, 0x013c24a8)\n\tNSTUB(sqlite_exec, 0x014224b4)\n\tNSTUB(sqlite_snprintf, 0x013ff32c)\n\tNSTUB(sqlite_mallocAlarm, 0x013fddcc)\n\n\tNSTUB(fuji_screen_write, 0x011d1fb4)\n\tNSTUB(fuji_discard_text_buffer, 0x011d1f90)\n\tNSTUB(fuji_update_buffer, 0x00e8d418)\n\n\tNSTUB(fuji_rst_config1, 0x011d2704) // Configures transparency, colors?\n\tNSTUB(fuji_rst_config2, 0x011fbb38) // configures order?\n\n\t// From show_photo_properties\n\tNSTUB(fuji_rst_rect, 0x0122c35c)\n\tNSTUB(fuji_rst_bmp, 0x0122ea68)\n\tNSTUB(fuji_rst_write, 0x011f2a5c)\n\n\tNSTUB(fuji_task_sleep, 0x00735864)\n\n\t//         Experimental:\n\n\tNSTUB(fuji_create_semaphore, 0x0073b3a4)\n\tNSTUB(fuji_return_semaphore, 0x00734848)\n\tNSTUB(fuji_get_semaphore, 0x00734938)\n\n\tNSTUB(fuji_wait_task_start, 0x00626044)\n\tNSTUB(fuji_wait_task_stop, 0x00625f34)\n\n\t// Only works in certain tasks\n\tNSTUB(fuji_task_suspend, 0x00734038)\n\tNSTUB(fuji_task_create, 0x00735c2c)\n\tNSTUB(fuji_task_check, 0x00734610)\n\tNSTUB(fuji_task_test, 0x00734848)\n\n\tNSTUB(fuji_apply_eeprom, 0x00633d1c)\n\n\t//NSTUB(fuji_get_key, 0x00d17d4c)\n\n\tNSTUB(fuji_dir_open, 0x0070ae18) // ?\n\tNSTUB(fuji_dir_next, 0x0070acd8)\n\n\tNSTUB(sensor_info, 0x00fee158)\n\tNSTUB(key_push, 0x011d2650)\n\tNSTUB(run_auto_act, 0x00fd5aa4)\n\n\tNSTUB(fuji_ptp_return, 0x00e507c0)\n\tNSTUB(fuji_ptp_finish, 0x00e514f4)\n\n\tNSTUB(fuji_show_gui, 0x00e13030)\n\tNSTUB(fuji_beep, 0x00e14d18)\n\n\tNSTUB(render_eep_menu, 0x00e2e720)\n\n\tNSTUB(run_s3_file, 0x00fd2480)\n\n\tNSTUB(fuji_get_task, 0x007332cc)\n\n\tNSTUB(flashloader_id, 0x0073935c)\n\tNSTUB(flashloader_0, 0x0064057c)\n\tNSTUB(flashloader_1, 0x0063e388)\n#endif\n\n/*\nflashloader_id(0x010b1000);\nuint32_t x = flashloader_0();\nflashloader_id(0x110b1000);\nSCREENDBG(\"Test: %X\\n\", x)\n*/\n\n\n// For hijacking view_photo_props\n// generate_branch((void*)0x011dd210, test, (void*)0x011dd210);\n\n// For writing to screen (a little flicker)\n// generate_call((void*)0x00664bbc, test, (void*)0x00664bbc);\n// must return FUN_00664a14()\n\n#define MEM_LAYER_INFO 0x0152e0f4\n",
            "file": "",
            "name": "xf1_101"
        },
        {
            "data": "#define MODEL_NAME \"Fujifilm X-T20\"\n#define MODEL_CODE \"00053661000536620005366400053665000536670005367000053669\"\n#define FIRM_URL \"https://dl.fujifilm-x.com/support/firmware/x-t20-210-9cy17ibx/FWUP0013.DAT\"\n\n#define FIRM_PTP_9805 0x00ecbb94\n#define FIRM_PTP_FINISH 0x00ed2b68\n#define FIRM_PTP_MAX 2000\n\n#ifdef STUBS\n\t#include \"stub.h\"\n#endif\n",
            "file": "",
            "name": "xt20_210"
        },
        {
            "data": "#define MODEL_NAME \"Fujifilm X-A1\"\n#define MODEL_CODE \"00030011000300120003001400030019\"\n",
            "file": "",
            "name": "xa1_150"
        },
        {
            "data": "/*\nStudying Z3 firmware is useful since it's an older revision.\n\nwhere /jobEndReason is on HS20EXR: 00e87bac\n\nwhere /jobEndReason should be on Z3: 0x0030d4f4\nwhere /jobEndReason really is on Z3: 0x00307524\n\nHow it's found: Search instruction:\ncmp r2, #0x71000000 or `71 04 52 e3`\n\n*/\n\n#define MODEL_NAME \"Fujifilm Z3\"\n#define MODEL_CODE \"1109111011121113111411151116\"\n\n#define MODEL_SIZE 128\n\n#define MEM_START 0x0030d4f4 - 10000\n#define TEXT_START 0x00307524 - 10000\n#define COPY_LENGTH 10000 + 6052\n",
            "file": "",
            "name": "z3_102"
        }
    ]
};