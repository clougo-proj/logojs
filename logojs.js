//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

import LibraryUtils from "./libraryUtils.js";

export default {
    "create": function create(host) {
        let logojs = { };

        if(typeof(Worker) === "undefined") {
            return undefined;
        }

        let worker =new Worker(new URL("./src/logoWorker.js", import.meta.url), {type: "module"});

        // handles messages from logo worker
        worker.onmessage = function(e) {
            let msg = e.data;

            if (msg instanceof ArrayBuffer) {
                let tqcache = new Float32Array(msg);
                host.call(undefined, "draw", tqcache);
                return;
            }

            let event = msg.shift();

            if (event == "created") {
                logojs.method = LibraryUtils.createProxyLibrary(msg.shift(), callLogoEngine);
                callLogoEngine("init", [LibraryUtils.getLibrarySignature(host)]);
            }

            if (event in host) {
                host[event].apply(null, msg);
            }
        };

        function callLogoEngine(method, args) {
            worker.postMessage([].concat(method, args));
        }

        return logojs;
    }
};