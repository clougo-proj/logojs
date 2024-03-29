//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Implements Logo's communication (I/O) primitives
// Runs in Logo worker thread

export default {
    "create": function(logo) {
        const comm = {};

        const methods = {
            "print": [primitivePrint, "[args] 1"],
            "pr": [primitivePrint, "[args] 1"],

            "type": [primitiveType, "[args] 1"],

            "show": [primitiveShow, "[args] 1"],

            "readword": primitiveReadword,

            "readlist": primitiveReadlist,
            "rl": primitiveReadlist,

            "cleartext": primitiveCleartext,
            "ct": primitiveCleartext,

        };
        comm.methods = methods;

        function primitivePrint(...args) {
            logo.io.call("out", args.map(v => logo.type.toString(v)).join(" "));
        }

        function primitiveShow(...args) {
            logo.io.call("out", args.map(v => logo.type.toString(v, true)).join(" "));
        }

        function primitiveType(...args) {
            logo.io.call("outn", args.map(v => logo.type.toString(v)).join(""));
        }

        async function primitiveReadword() {
            return await logo.env.getUserInput();
        }

        async function primitiveReadlist() {
            let userInput = await logo.env.getUserInput();
            let newList = logo.type.makeLogoList();
            let backSlash = false;
            let verticalBar = false;
            var word = "";
            for (var i = 0; i < userInput.length; i++) {
                if (userInput.charAt(i) === "\\" && i + 1 != userInput.length) {
                    backSlash = true;
                } else if (backSlash === true) {
                    word += userInput.charAt(i);
                    backSlash = false;
                } else if (verticalBar === true) {
                    if (userInput.charAt(i) === "|") {
                        verticalBar = false;
                    } else {
                        word += userInput.charAt(i);
                    }
                } else {
                    if (userInput.charAt(i) === " ") {
                        newList.push(word);
                        word = "";
                    } else if (userInput.charAt(i) === "|") {
                        verticalBar = true;
                    } else {
                        word = word + userInput.charAt(i);
                    }
                }
            }

            if (word != "") {
                newList.push(word);
            }

            return newList;
        }

        function primitiveCleartext() {
            logo.io.call("cleartext");
        }

        return comm;
    }
};
