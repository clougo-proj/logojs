//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Implements miscellaneous primitives
// Runs in Logo worker thread

export default {
    "create": function(logo) {
        const misc = {};

        const methods = {

            "demo": primitiveDemo,

            "loadedit": primitiveLoadedit,
            "lde": primitiveLoadedit,

            "saveedit": primitiveSaveedit,
            "sae": primitiveSaveedit,

            "listfile": [primitiveListfile, "[pattern .novalue]"],
            "ls": [primitiveListfile, "[pattern .novalue]"],
            "dir": [primitiveListfile, "[pattern .novalue]"],
            "catalog": [primitiveListfile, "[pattern .novalue]"],

            "erasefile": primitiveErasefile,
            "erf": primitiveErasefile,

            "unerasefile": primitiveUnerasefile,

            ".test": dotTest
        };
        misc.methods = methods;

        async function primitiveDemo(name) {
            let option = undefined;
            if (logo.type.isLogoList(name)) {
                option = logo.type.listItem(2, name).toLowerCase();
                name = logo.type.listItem(1, name).toLowerCase();
            } else {
                name = name.toLowerCase();
            }

            let demoFileName = name + ".lgo";

            let src = await logo.logofs.readFile("/demo/" + demoFileName);

            if (option !== undefined && option == "load") {
                logo.io.call("editorLoad", src);
            }

            await logo.env.logoExec(src, "/demo/" + demoFileName);
        }

        async function primitiveSaveedit(fileName) {
            let success = await logo.io.call("editorSaveToLocalStorage", fileName);
            if (!success) {
                throw logo.type.LogoException.CANNOT_OVERWRITE_FILE.withParam([fileName], logo.env.getProcSrcmap());
            }
        }

        async function primitiveLoadedit(fileName) {
            let success = await logo.io.call("editorLoadFromLocalStorage", fileName);
            if (!success) {
                throw logo.type.LogoException.FILE_NOT_FOUND.withParam([fileName], logo.env.getProcSrcmap());
            }
        }

        async function primitiveListfile(pattern = undefined) {
            let fileList = await logo.io.call("listFilesInLocalStorage");
            if (pattern !== undefined) {
                fileList = fileList.filter((fileName) => fileName.indexOf(pattern)!= -1);
            }

            logo.io.call("out", fileList.join("\n"));
        }

        async function primitiveErasefile(fileName) {
            let success = await logo.io.call("eraseFileInLocalStorage", fileName);
            if (!success) {
                throw logo.type.LogoException.FILE_NOT_FOUND.withParam([fileName], logo.env.getProcSrcmap());
            }
        }

        async function primitiveUnerasefile(fileName) {
            if (await logo.io.call("fileExistsInLocalStorage", fileName)) {
                throw logo.type.LogoException.FILE_EXISTS.withParam([fileName], logo.env.getProcSrcmap());
            }

            let success = await logo.io.call("uneraseFileInLocalStorage", fileName);
            if (!success) {
                throw logo.type.LogoException.FILE_NOT_FOUND.withParam([fileName], logo.env.getProcSrcmap());
            }
        }

        async function dotTest(testName, testMethod) {
            await logo.env.runSingleTest(testName, testMethod);
        }

        return misc;
    }
};
