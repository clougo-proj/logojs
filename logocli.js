#!/usr/bin/env node

//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Logo CLI

import { readFileSync } from "fs";

import { Logo, sys } from "./src/logoc.js";

const out = console.log; // eslint-disable-line no-console
const outn = function(v) { process.stdout.write(v); };
const err = console.error; // eslint-disable-line no-console

Logo.testRunner.out = out;
Logo.testRunner.outn = outn;

const ext = makeLogoHost();
const logo = Logo.create(ext);
const cmd = parseArgv(process.argv);

logo.env.loadDefaultLogoModules()
    .then(postCreation);

function postCreation() {
    const srcRunner = makeSrcRunner();

    let cwd = process.cwd();

    cwd.replace(/\\/, "/");

    if (!("file" in cmd) && cmd.op === Logo.mode.EXEC) {
        cmd.op = Logo.mode.CONSOLE;
    }

    if (cmd.op in srcRunner) {
        logo.env.getGlobalScope().argv = logo.type.makeLogoList(cmd.argv);

        const logoSrc = readFileSync(cwd + "/" + cmd.file, "utf8"); // logo source file (.lgo)

        srcRunner[cmd.op](logoSrc, cmd.file)
            .then(() => process.exit())
            .catch(e => {
                err(e);
                process.exit(-1);
            });

        return;
    }

    if (cmd.op === Logo.mode.TEST) {
        Logo.testRunner.runTests("file" in cmd ? [cmd.file] : [], logo)
            .then(failCount => process.exit(failCount !== 0))
            .catch(e => {
                err(e);
                process.exit(-1);
            });

        return;
    }

    if (cmd.op === Logo.mode.CONSOLE) {
        process.stdout.write("Welcome to Logo\n? ");
        logo.env.setInteractiveMode();
        setupInputListener(logo.env.console, logo.env.getEnvState);
        return;
    }

    err(
        "Usage:\n" +
            "\tnode logo                            - interactive mode\n" +
            "\tnode logo <LGO file>                 - compile to JS and execute\n" +
            "\tnode logo --parse <LGO file>         - parse only\n" +
            "\tnode logo --codegen <LGO file>       - generate JS code\n" +
            "\tnode logo --run <LGO file>           - run with interpreter\n" +
            "\tnode logo --exec <LGO file>          - compile to JS and execute\n" +
            "\tnode logo --execjs <JS file>         - execute precompiled JS\n" +
            "\tnode logo --test [<test name>]       - run JavaScript unit test file\n\n" +
            "\toptions:[--on,--off,--trace]\n" +
            "\ttrace:[parse,evx,codegen,lrt,time,draw]\n"
    );

    process.exit();
}

function parseArgv(argv) {
    let cmd = {};

    cmd.op = Logo.mode.EXEC;
    cmd.argv = [];

    for(let i = 2; i < argv.length; i++) {
        if (!("file" in cmd)) {
            if (argv[i].match(/^--/)) {
                parseOption(argv[i].substring(2));
                continue;
            }

            cmd.file = argv[i];
        } else {
            cmd.argv.push(argv[i]);
        }
    }

    return cmd;

    function parseOption(optionStr) {
        let expectedOptions = {
            "on": (key) => logo.config.set(key, true),
            "off": (key) => logo.config.set(key, false),
            "trace": logo.trace.enableTrace
        };

        let optionPair = optionStr.split(":");

        if (optionPair.length == 2) {
            sys.assert(optionPair[0] in expectedOptions, "Unknown option " + optionPair[0]);

            optionPair[1].split(",").map(expectedOptions[optionPair[0]]);
            return;
        }

        sys.assert(optionPair.length == 1, "Option parse error:" + optionStr);
        sys.assert(optionPair[0] in Logo.modeName, "Unknown option " + optionPair[0]);

        cmd.op = optionPair[0];
    }
}

function makeSrcRunner() {
    const srcRunner = {};

    srcRunner[Logo.mode.RUN] = logo.env.logoRun,
    srcRunner[Logo.mode.RUNL] = logo.env.logoRunByLine,
    srcRunner[Logo.mode.EXEC] = logo.env.logoExec,
    srcRunner[Logo.mode.EXECL] = logo.env.logoExecByLine,
    srcRunner[Logo.mode.EXECJS] = async function(src) { await logo.env.evalLogoJsTimed(src); };
    srcRunner[Logo.mode.PARSE] = async function(src) {
        out(JSON.stringify(logo.parse.parseBlock(logo.parse.parseSrc(src, 1))));
    };

    srcRunner[Logo.mode.CODEGEN] = async function(src) {
        out(await logo.env.codegenOnly(src));
    };

    return srcRunner;
}

function makeLogoHost() {
    let _focus = "Clougo";

    const logoEvent = {
        "exit": function(batchMode) {
            if (!batchMode) {
                out("Thank you for using Logo. Bye!");
            }

            process.exit();
        },
        "out": console.log,  // eslint-disable-line no-console
        "outn": function(v) { process.stdout.write(v); },
        "err": console.error,  // eslint-disable-line no-console
        "errn": function(v) { process.stderr.write(v); },
        "cleartext": function() { process.stdout.write(sys.getCleartextChar()); },
        "getfocus": function() { return _focus; },
        "setfocus": function(name) { _focus = name; }
    };

    return  {
        "io": {
            "call": function(...args) {
                let procName = args.shift();
                if (procName in logoEvent) {
                    return logoEvent[procName].apply(null, args);
                }
            },
            "readfile": fileName => readFileSync(fileName, "utf8")
        },
        "canvas": {
            "flush": () => {},
            "sendCmd": function(cmd, args = []) {
                logo.trace.info(cmd + " " + args.map(sys.logoFround6).join(" "), "draw");
            },
            "sendCmdAsString": function(cmd, args = []) {
                logo.trace.info(cmd + " " + args.join(" "), "draw");
            }
        }
    };
}

function setupInputListener(logoUserInputListener, getEnvState) {
    const sysstdin = process.openStdin();
    sysstdin.addListener("data", function(d) {
        logoUserInputListener(d).then(() => {

            let envState = getEnvState();

            if (envState == "exit") {
                process.exit();
            }

            let prompt = envState == "ready" ? "? " :
                envState == "multiline" ? "> " :
                    envState == "vbar" ? "| " : "";

            process.stdout.write(prompt);
        });
    });
}