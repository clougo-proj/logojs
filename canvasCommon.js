//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Interface of low-level primitives for Logo graphics

export default (() => {
    const CanvasCommon = {};
    CanvasCommon.primitive = {
        // "<primitive>" : [<primitivecode>, <num_of_param>]
        "clean": [0, 0],
        "drawto": [1, 3],
        "moveto": [2, 3],
        "showturtle": [4, 0],
        "hideturtle": [5, 0],
        "penpaint": [6, 0],
        "penerase": [7, 0],
        "penreverse": [8, 0],
        "pencolor": [9, 3],
        "bgcolor": [10, 3],
        "fillcolor": [11, 3],
        "arc": [12, 7],
        "ellipse": [13, 9],
        "drawtext": [14, 2],
        "fill": [15, 1],
        "pensize": [16, 1]
    };

    CanvasCommon.PenMode = {
        "paint": "source-over",
        "erase": "destination-out",
        "reverse": "xor"
    };

    CanvasCommon.getPrimitiveCode = function(name) {
        return CanvasCommon.primitive[name][0];
    };

    CanvasCommon.getPrimitiveParamCount = function(code) {
        return CanvasCommon.primitivecode[code][1];
    };

    CanvasCommon.primitivecode = {};
    for (let p in CanvasCommon.primitive) {
        let code = CanvasCommon.primitive[p][0];
        let count = CanvasCommon.primitive[p][1];
        CanvasCommon.primitivecode[code] = [p, count];
    }

    CanvasCommon.getPrimitive = function(code) {
        return CanvasCommon.primitivecode[code][0];
    };

    CanvasCommon.fround = function(num) {
        return Math.round(num*1e6)/1e6;
    };

    CanvasCommon.getPrimitiveCodeParamCount = function(code) {
        return CanvasCommon.primitivecode[code][1];
    };

    CanvasCommon.createSender = function(send, sendBinary) {
        const sender = {};
        const tqCacheSize = 128;
        let tqCacheArray = new Float32Array(tqCacheSize);
        let tqCachePtr = 0;

        sender.sendCmd = function(cmd, args = []) {
            let code = CanvasCommon.getPrimitiveCode(cmd);
            if (code in CanvasCommon.primitivecode) {
                if (tqCachePtr + args.length >= tqCacheSize - 1) {
                    sender.flush();
                }

                tqCacheArray[++tqCachePtr] = code;
                for (let i = 0; i < args.length; i++) {
                    tqCacheArray[++tqCachePtr] = args[i];
                }
            }
        };

        sender.sendCmdAsString = function(cmd, args = []) {
            let code = CanvasCommon.getPrimitiveCode(cmd);
            if (code in CanvasCommon.primitivecode) {
                let length = args.length + 2;
                sender.flush();
                send([].concat(length, code, args));
            }
        };

        sender.flush = function() {
            if (tqCachePtr==0) return;
            tqCacheArray[0] = tqCachePtr + 1; // store the length as first element;
            sendBinary(tqCacheArray.buffer);
            tqCacheArray = new Float32Array(tqCacheSize);
            tqCachePtr = 0;
        };

        return sender;
    };

    return CanvasCommon;
})();
