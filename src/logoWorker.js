//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Logo worker for Clougo

import CanvasCommon from "../canvasCommon.js";

import LibraryUtils from "../libraryUtils.js";

import { Logo, sys } from "./logoc.js";

const LOGO_LIBRARY = Logo.constants.LOGO_LIBRARY;

const ext = makeLogoHost();
const logo = Logo.create(ext);

let _resolveCall = {};

logo.env.loadDefaultLogoModules();

let logoEngine = {
    "init":(logoHost, config=undefined) => {
        logo.io = LibraryUtils.createProxyLibrary(logoHost, callExtFunc);

        Logo.testRunner.out = (val) => logo.io.call("out", val);
        Logo.testRunner.outn = (val) => logo.io.call("outn", val);

        if (config !== undefined) {
            logo.config.override(config);
            logo.env.loadDefaultLogoModules();
        }

        logo.io.call("ready");
    },
    "test": async function() {
        logo.io.call("busy");
        await Logo.testRunner.runTests(undefined, logo);
        logo.io.call("ready");
    },
    "run": (src, srcPath) => logo.env.logoRun(src, srcPath),
    "exec": (src, srcPath) => logo.env.logoExec(src, srcPath),
    "console": async function(line) {
        logo.io.call("busy");
        logo.env.setInteractiveMode();
        await logo.env.console(line + logo.type.NEWLINE);  // needs new line to be treated as completed command
        logo.io.call(logo.env.getEnvState());
    },
    "clearWorkspace": function() {
        logo.io.call("busy");
        logo.env.clearWorkspace();
        logo.env.loadDefaultLogoModules();
        logo.lrt.util.getLibrary(LOGO_LIBRARY.GRAPHICS).draw();
        logo.io.call("ready");
    },
    "keyboardEvent": function(event) {
        logo.lrt.util.getLibrary(LOGO_LIBRARY.GRAPHICS).onKeyboardEvent(event);
    },
    "mouseEvent": function(event) {
        logo.lrt.util.getLibrary(LOGO_LIBRARY.GRAPHICS).onMouseEvent(event);
    },
    "returnValue": onExtFuncReturnVal,
    "turtleUndo": function() {
        logo.lrt.util.getLibrary(LOGO_LIBRARY.GRAPHICS).undo();
    }
};

// listen to events in the worker
self.addEventListener("message",
    async function(e) {
        logo.env.setEnvState("ready");
        let method = e.data.shift();
        sys.assert(method in logoEngine);
        await logoEngine[method].apply(null, e.data);
        logo.canvas.flush();
    }, false);

postMessage(["created", LibraryUtils.getLibrarySignature(logoEngine)]);

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
    logo.env.prepareToBeBlocked();
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
        (buffer) => logo.io.call("draw", buffer), // logo.io.canvas(msg),
        (buffer) => postMessage(buffer, [buffer]) // pass by reference
    );

    return {
        "canvas": canvas
    };
}
