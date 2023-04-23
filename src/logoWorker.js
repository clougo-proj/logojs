//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Logo worker for Clougo

import CanvasCommon from "../canvasCommon.js";

import LibraryUtils from "../libraryUtils.js";

import Sys from "./sys.js";

import { Logo } from "./logoc.js";

const sys = Sys.create(false);

logoWorker();

async function logoWorker() {
    const host = makeLogoHost();

    let logoCore = await Logo.create(host, sys);

    let _resolveCall = {};

    // listen to events in the worker
    self.addEventListener("message",
        async function(e) {
            let method = e.data.shift();
            sys.assert(method in logoCore);
            await logoCore[method].apply(null, e.data);
            host.canvas.flush();
        }, false);

    postMessage(["created", LibraryUtils.getLibrarySignature(logoCore)]);

    function generateCallId() {
        return crypto.randomUUID();
    }

    async function callExtFunc(method, args) {
        let callId = generateCallId();
        let promise = new Promise((resolve) => {
            _resolveCall[callId] = resolve;
        });

        args.unshift(callId);
        postMessage([].concat(method, args));
        host.canvas.flush();
        return await promise;
    }

    function onExtFuncReturnVal(retVal, callId) {
        if (callId in _resolveCall) {
            _resolveCall[callId](retVal);
            delete _resolveCall[callId];
        }
    }

    function makeLogoHost() {
        const canvas = CanvasCommon.createSender(
            (buffer) => postMessage(["call", undefined, "draw", buffer]), // logo.io.canvas(msg),
            (buffer) => postMessage(buffer, [buffer]) // pass by reference
        );

        return {
            "canvas": canvas,
            "callExtFunc": callExtFunc,
            "onExtFuncReturnVal": onExtFuncReturnVal
        };
    }
}
