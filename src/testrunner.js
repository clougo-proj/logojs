//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Logo unit test runner

import CONSTANTS from "../constants.js";

export default {
    "create": function(logoCore, sys) {
        const testRunner = {};

        const NEWLINE = CONSTANTS.NEWLINE;

        const out = (val) => logoCore.getHost().io.call("out", val);
        const outn = (val) => logoCore.getHost().io.call("outn", val);

        let testHost, testCore;
        let count, failCount;
        let reFilter;
        let curDirName;
        let singleTestMode = false;

        async function runTests(testNamePatterns) {
            await initializeTestEnv(logoCore.getHost());
            singleTestMode = testCore.getConfig("verbose"); // logoForUnitTests.config.get("verbose");

            // make regex for filtering unit tests by their full names
            reFilter = sys.isUndefined(testNamePatterns) ? undefined : sys.makeMatchListRegexp(testNamePatterns);
            count = 0;
            failCount = 0;

            await runUnitTestDir();
            out("Total:" + count + "\tFailed:" + failCount);
            return failCount;
        }
        testRunner.runTests = runTests;

        async function runSingleTest(fullTestName, testMethod) {
            await initializeTestEnv(logoCore.getHost());
            singleTestMode = true;

            let testInfo = getTestInfo(fullTestName);
            let prefix = testInfo[0];
            let testName = testInfo[1];

            await runTestHelper(prefix, testName, testMethod);
        }
        testRunner.runSingleTest = runSingleTest;

        async function initializeTestEnv(host) {
            testHost = makeLogoTestHost(host);
            testCore = await logoCore.clone(testHost);
        }

        function getTestInfo(fullTestName) {
            let testPath = fullTestName.split(".");
            let prefix = testPath.slice(0, -1).join(".");
            let testName =  testPath[testPath.length - 1];
            return [prefix, testName];
        }

        function parseTestList(obj) {
            if (!logoCore.getLogofs().exists(obj)) {
                return [];
            }

            let cases = obj.split(/\r?\n/);
            if (cases.length === 0) {
                return [];
            }

            let match = cases[0].match(/^\s*configOverride:\s*(?<configOverride>\S+)/);

            let configOverride = "";
            if (match) {
                configOverride = match.groups.configOverride;
                cases.shift();
            }

            return cases.map(line => line.replace(/#.*$/, ""))
                .filter(line => !line.match(/^\s*$/))
                .map(line => line.split(/\s+/))
                .map(line => [line[0], line.slice(1).map(mode => mode + configOverride)]);
        }

        async function runUnitTestsInCurrentDir(prefix) {
            let tests = parseTestList(await logoCore.getLogofs().tryGetObj(getDirName(prefix) + "/list.txt"));
            for (let test of tests) {
                let testName = prefix + "." + test[0];
                if (sys.isUndefined(reFilter) || testName.match(reFilter)) {
                    await runTest(prefix, test);
                }
            }
        }

        async function runUnitTestsInSubDirs(prefix) {
            for (let subDir of await logoCore.getLogofs().readSubDirs(getDirName(prefix))) {
                await runUnitTestDir(sys.isUndefined(prefix) ? subDir : prefix + "." + subDir);
            }
        }

        async function runUnitTestDir(prefix) {
            await runUnitTestsInCurrentDir(prefix);
            await runUnitTestsInSubDirs(prefix);
        }

        function makeLogoTestHost(host) {

            let stdoutBuffer = "";
            let stderrBuffer = "";
            let turtleBuffer = "";

            let _focus = "Clougo";

            const logoEvent = {
                "getfocus": function() { return _focus; },
                "setfocus":  function(name) { _focus = name; },
                "out": function(text) {
                    stdoutBuffer += text + NEWLINE;
                },
                "outn": function(text) {
                    stdoutBuffer += text;
                },
                "err": function(text) {
                    stderrBuffer += text + NEWLINE;
                },
                "errn": function(text) {
                    stderrBuffer += text;
                },
                "cleartext": function() {
                    stdoutBuffer += sys.getCleartextChar();
                }
            };

            const testHost = {
                "test": {
                    "clearBuffers": function() {
                        stdoutBuffer = "";
                        stderrBuffer = "";
                    },
                    "getStdoutBuffer": () => stdoutBuffer,
                    "getStderrBuffer": () => stderrBuffer
                },
                "io": {
                    "call": function(...args) {
                        let procName = args.shift();
                        if (procName in logoEvent) {
                            return logoEvent[procName].apply(null, args);
                        }
                    },
                    "readfile": async fileName => await logoCore.getLogofs().readFile(curDirName + "/" + fileName)
                },
                "canvas": {
                    "flush": () => {},
                    "clearBuffer": function() {
                        turtleBuffer = "";
                    },
                    "getBuffer": function() { return turtleBuffer; },
                    "sendCmd": function(cmd, args = []) {
                        host.canvas.sendCmd(cmd, args);
                        turtleBuffer += cmd + " " + args.map(sys.logoFround6).join(" ") + NEWLINE;
                    },
                    "sendCmdAsString": function(cmd, args = []) {
                        host.canvas.sendCmdAsString(cmd, args);
                        turtleBuffer += cmd + " " + args.join(" ") + NEWLINE;
                    }
                }
            };

            return testHost;
        }

        async function runTest(prefix, test) {
            let testName = test[0];
            let testCmds = test[1];
            for (let testCmd of testCmds) {
                await runTestHelper(prefix, testName, testCmd);
            }
        }

        async function getTestFile(fileName) {
            let ret = await logoCore.getLogofs().tryGetObj(curDirName + "/" + fileName);
            return ret === undefined ? "" : ret;
        }

        async function getTestSrc(testName) {
            return await getTestFile(testName + ".lgo");
        }

        async function getTestInBase(testName) {
            return await getTestFile(testName + ".in");
        }

        async function getTestOutBase(testName) {
            return expandBuiltInMacros(await getTestFile(testName + ".out"));
        }

        async function getTestErrBase(testName) {
            return expandBuiltInMacros(await getTestFile(testName + ".err"));
        }

        async function getTestDrawBase(testName) {
            return await getTestFile(testName + ".draw");
        }

        async function getTestParseBase(testName) {
            return await getTestFile(testName + ".parse");
        }

        async function testParse(testName) {
            let testSrc = await getTestSrc(testName);
            let testParseBase = await getTestParseBase(testName);
            let parseResult = await testCore.parse(testSrc) + NEWLINE;
            if (parseResult == testParseBase) {
                out("\t\tpassed ");
                return;
            }

            out("\t\tfailed");
            if (singleTestMode) {
                outputIfDifferent("parsed", parseResult, testParseBase);
            }

            failCount++;
        }

        async function tryRunTestMethod(testSrc, testName, runTestMethod) {
            try {
                await runTestMethod(testSrc, testName);
                return true;
            } catch (e) {
                out("\t\tfailed");
                if (singleTestMode) {
                    out(e.stack);
                }

                return false;
            }
        }

        async function testGenericRun(testName, runTestMethod) {
            let testSrcName = testName + ".lgo";
            let testSrc = await getTestSrc(testName);
            testHost.test.clearBuffers();
            testHost.canvas.clearBuffer();

            if (!testSrc) {
                out("\t\tnot found!");
                failCount++;
                return;
            }

            if (!await tryRunTestMethod(testSrc, testSrcName, runTestMethod)) {
                failCount++;
                return;
            }

            const outExpected = await getTestOutBase(testName);
            const errExpected = await getTestErrBase(testName);
            const drawExpected = await getTestDrawBase(testName);

            const outActual = testHost.test.getStdoutBuffer();
            const errActual = testHost.test.getStderrBuffer();
            const drawActual = testHost.canvas.getBuffer();

            if (outActual == outExpected && errActual == errExpected && drawActual == drawExpected) {
                out("\t\tpassed\trun time: " + testCore.getRunTime() + "ms");
                return;
            }

            out("\t\tfailed");
            if (singleTestMode) {
                outputIfDifferent("out", outActual, outExpected);
                outputIfDifferent("err", errActual, errExpected);
                outputIfDifferent("draw", drawActual, drawExpected);
            }

            failCount++;
        }

        function outputIfDifferent(type, actual, expected) {
            if (expected !== actual) {
                out("Expected " + type + ":\n<" + expected + ">\n\tActual " + type + ":\n<" + actual + ">");
            }
        }

        function padStart(str, num, pad) {
            return (pad.repeat(num) + str).slice(-num);
        }

        function expandBuiltInMacros(str) {
            let reDateTimeFormat = /\$dateTimeFormat\("(?<date>.*?)"\)/;
            let found = str.match(reDateTimeFormat);

            if (!found) {
                return str;
            }

            return str.replace(reDateTimeFormat, formatDateTime(found.groups.date));
        }

        function formatDateTime(dtFormat)  {
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            let dateTime = new Date();
            return dtFormat.replace(/<EEE>/, days[dateTime.getDay()])
                .replace(/<MMM>/, months[dateTime.getMonth()])
                .replace(/<M>/, dateTime.getMonth() + 1)
                .replace(/<dd>/, padStart(dateTime.getDate(), 2, "0"))
                .replace(/<HH>/, padStart(dateTime.getHours(), 2, "0"))
                .replace(/<mm>/, padStart(dateTime.getMinutes(), 2, "0"))
                .replace(/<ss>/, padStart(dateTime.getSeconds(), 2, "0"))
                .replace(/<yyyy>/, dateTime.getFullYear());
        }

        function parseConfigs(tokens, sign) {
            return tokens.filter(token => token.charAt(0) === sign)
                .map(token => token.substring(1));
        }

        function toConfigOverride(onConfigKeys, offConfigKeys) {
            if (onConfigKeys.length === 0 && offConfigKeys.length === 0) {
                return undefined;
            }

            let configOverride = {};
            onConfigKeys.forEach(key => { configOverride[key] = true; });
            offConfigKeys.forEach(key => { configOverride[key] = false; });
            return configOverride;
        }

        function toTestSettings(testMethod) {
            let tokens = testMethod.split(/,/);
            let mode = tokens.shift();
            let configOverride = toConfigOverride(parseConfigs(tokens, "+"), parseConfigs(tokens, "-"));
            return (configOverride === undefined) ? { "mode": mode } :
                { "mode": mode, "configOverride": configOverride };
        }

        function getDirName(prefix) {
            return prefix === undefined ? "/unittests" : "/unittests/" + prefix.replace(/\./g, "/");
        }

        async function runTestHelper(prefix, testName, testMethod) {
            count++;

            curDirName = getDirName(prefix);
            outn(prefix + "." + testName + "(" + testMethod + "):");

            let testSettings = toTestSettings(testMethod);
            let testInBase = (await getTestInBase(testName)).toString();

            await testCore.runTestHelper(async () => {
                if (testSettings.mode === "parse") {
                    await testParse(testName);
                } else {
                    sys.assert(testSettings.mode in testCore);
                    await testGenericRun(testName, testCore[testSettings.mode]);
                }
            }, testSettings, testInBase);
        }

        return testRunner;
    }
};
