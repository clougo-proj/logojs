//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Logo core module

import TestRunner from "./testrunner.js";
import CONSTANTS from "../constants.js";
import Config from "./config.js";
import Type from "./type.js";
import Trace from "./trace.js";
import Env from "./env.js";
import Interpreter from "./interpreter.js";
import Codegen from "./codegen.js";
import Parse from "./parse.js";
import Lrt from "./lrt.js";
import Logofs from "./logofs.js";
import LibraryUtils from "../libraryUtils.js";

export const Logo = {};

const LOGO_LIBRARY = CONSTANTS.LOGO_LIBRARY;

const mode = {
    CODEGEN: "codegen",
    CONSOLE: "console",
    EXEC: "exec",
    EXECJS: "execjs",
    EXECL: "execl",
    HELP: "help",
    PARSE: "parse",
    RUN: "run",
    RUNL: "runl",
    TEST: "test"
};

const _modeName = ((mode) => {
    const modeName = {};
    Object.keys(mode).forEach(key => {
        modeName[mode[key]] = key;
    });
    return modeName;
})(mode);

Logo.create = async function(host, sys) {

    const logo = {};

    logo.io = host.io;
    logo.canvas = host.canvas;

    logo.config = Config.create(sys);
    logo.type = Type.create(sys);

    logo.trace = Trace.create(logo, sys);
    logo.env = Env.create(logo, sys);
    logo.interpreter = Interpreter.create(logo, sys);
    logo.codegen = Codegen.create(logo, sys);
    logo.parse = Parse.create(logo, sys);
    logo.lrt = Lrt.create(logo, sys);

    logo.env.initLogoEnv();

    await logo.env.loadDefaultLogoModules();

    logo.logofs = Logofs.create(logo, sys);

    let logoCore = {
        "init":(logoHost) => {
            host.io = LibraryUtils.createProxyLibrary(logoHost, host.callExtFunc);
            logo.io = host.io;
            logo.io.call("ready");
        },
        "test": async function(testNamePatterns) {
            logo.io.call("busy");
            await logo.testRunner.runTests(testNamePatterns);
            logo.io.call("ready");
        },
        "runTestHelper": async (runTest, testSettings, testInBase) => {
            logo.env.initLogoEnv();
            logo.env.injectUserInput(testInBase);

            let backupConfig = logo.config;
            if ("configOverride" in testSettings) {
                logo.config = backupConfig.clone().override(testSettings.configOverride);
            }

            await logo.env.loadDefaultLogoModules();

            await runTest();

            logo.config = backupConfig;
        },
        "parse": async (src) => {
            let result = JSON.stringify(logo.parse.parseBlock(logo.parse.parseSrc(src, 1)));
            logo.io.call("out", result);
            return result;
        },
        "codegen": async (src) => {
            logo.io.call("out", await logo.env.codegenOnly(src));
        },
        "run": logo.env.logoRun,
        "runl": logo.env.logoRunByLine,
        "exec": logo.env.logoExec,
        "execl": logo.env.logoExecByLine,
        "execjs": logo.env.evalLogoJsTimed,
        "getRunTime": logo.env.getRunTime,
        "console": async function(line) {
            logo.io.call("busy");
            await logo.env.console(line + CONSTANTS.NEWLINE);  // needs new line to be treated as completed command
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
        "returnValue": host.onExtFuncReturnVal,
        "getEnvState": logo.env.getEnvState,
        "setArgv": function(argv) {
            logo.env.getGlobalScope().argv = logo.type.makeLogoList(argv);
        },
        "getConfig": logo.config.get,
        "setConfigs": async function(options) {
            const expectedOptions = {
                "on": (key) => logo.config.set(key, true),
                "off": (key) => logo.config.set(key, false),
                "trace": logo.trace.enableTrace
            };

            for(let option of options) {
                let optionPair = option.split(":");
                sys.assert(optionPair.length == 2);
                sys.assert(optionPair[0] in expectedOptions, "Unknown option " + optionPair[0]);
                optionPair[1].split(",").map(expectedOptions[optionPair[0]]);
            }

            await logo.env.loadDefaultLogoModules();
        },
        "trace": logo.trace.info,
        "isLogoMode": (value) => {
            return value in _modeName;
        },
        "clone": async(host) => await Logo.create(host, sys),
        "getHost": () => host,
        "getLogofs": () => logo.logofs,
        "turtleUndo": function() {
            logo.lrt.util.getLibrary(LOGO_LIBRARY.GRAPHICS).undo();
        }
    };

    logo.testRunner = TestRunner.create(logoCore, sys);

    return logoCore;

}; // Logo.create
