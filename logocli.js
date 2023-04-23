#!/usr/bin/env node

//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Logo CLI

import { readFileSync } from "fs";

import Sys from "./src/sys.js";

import { Logo } from "./src/logoc.js";

logocli();

async function logocli() {
    const sys = Sys.create(true);

    const host = makeLogoHost();

    const cmd = parseArgv(process.argv);

    let logoCore = await Logo.create(host, sys);
    await logoCore.setConfigs(cmd.options);

    let cwd = process.cwd();

    cwd.replace(/\\/, "/");

    if (!("file" in cmd) && cmd.op === "exec") {
        cmd.op = "console";
    }

    if (cmd.op === "test") {
        try {
            let failCount = await logoCore.test("file" in cmd ? [cmd.file] : []);
            if (failCount) {
                process.exit(-1);
            }

            return;
        } catch (e) {
            console.error(e);
            process.exit(-1);
        }
    }

    sys.assert(logoCore.isLogoMode(cmd.op), "Unknown option " + cmd.op);

    if (cmd.op in logoCore && "file" in cmd) {
        logoCore.setArgv(cmd.argv);

        const logoSrc = readFileSync(cwd + "/" + cmd.file, "utf8"); // logo source file (.lgo)

        try {
            await logoCore[cmd.op](logoSrc, cmd.file);
            process.exit();
        } catch (e) {
            console.error(e);
            process.exit(-1);
        }
    }

    if (cmd.op === "console") {
        process.stdout.write("Welcome to Logo\n? ");
        setupInputListener(logoCore.console, logoCore.getEnvState);
        return;
    }

    console.error(
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
    // }

    function parseArgv(argv) {
        let cmd = {};

        cmd.op = "exec";
        cmd.argv = [];
        cmd.options = [];

        for(let i = 2; i < argv.length; i++) {
            if (!("file" in cmd)) {
                if (argv[i].match(/^--/)) {
                    let option = argv[i].substring(2);
                    if (argv[i].includes(":")) {
                        cmd.options.push(option);
                    } else {
                        cmd.op = option;
                    }

                    continue;
                }

                cmd.file = argv[i];
            } else {
                cmd.argv.push(argv[i]);
            }
        }

        return cmd;
    }

    function makeLogoHost() {
        let _focus = "Clougo";

        const logoEvent = {
            "exit": function() {
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
                    logoCore.trace(cmd + " " + args.map(sys.logoFround6).join(" "), "draw");
                },
                "sendCmdAsString": function(cmd, args = []) {
                    logoCore.trace(cmd + " " + args.join(" "), "draw");
                }
            }
        };
    }

    function setupInputListener(logoUserInputListener, getEnvState) {
        const sysstdin = process.openStdin();
        sysstdin.addListener("data", function(d) {
            if (d !== undefined) {
                d = d.toString().trimEnd();
            }

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
}