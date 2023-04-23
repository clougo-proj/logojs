//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Implements Logo's workspace management primitives
// Runs in Logo worker thread

import CONSTANTS from "../constants.js";

export default {
    "create": function(logo) {
        const ws = {};

        const PROC_ATTRIBUTE = CONSTANTS.PROC_ATTRIBUTE;

        const methods = {

            "to": primitiveTo,

            "define": primitiveDefine,

            ".defmacro": primitiveDefmacro,

            "text": primitiveText,

            "make": {jsFunc: primitiveMake, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR},

            "local": [primitiveLocal, "[args] 1"],

            "localmake": primitiveLocalmake,

            "namep": {jsFunc: primitiveNamep, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR},
            "name?": {jsFunc: primitiveNamep, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR},

            "thing": {jsFunc: primitiveThing, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR},

            "pprop": primitivePprop,

            "gprop": primitiveGprop,

            "remprop": primitiveRemprop,

            "plist": primitivePlist,

            "load": primitiveLoad,

            "help": primitiveHelp,

            "procedurep": primitiveProcedurep,

            "macrop": primitiveMacrop
        };
        ws.methods = methods;

        function getBodyFromText(text) {
            let bodyText = logo.type.unboxList(logo.type.listButFirst(text));
            return logo.type.makeLogoList(logo.type.flattenList(bodyText, CONSTANTS.NEWLINE));
        }

        function getBodySrcmapFromText(text) {
            let srcmap = logo.type.getEmbeddedSrcmap(text);
            if (srcmap === logo.type.SRCMAP_NULL) {
                return logo.type.SRCMAP_NULL;
            }

            let bodyTextSrcmap = logo.type.unboxList(logo.type.listButFirst(srcmap));
            return logo.type.makeLogoList(logo.type.flattenList(bodyTextSrcmap, logo.type.SRCMAP_NULL));
        }

        function getFormalFromText(text) {
            let ret = logo.type.unboxList(logo.type.listFirst(text)).map(v => {
                if (typeof v === "string") {
                    return v.toLowerCase();
                }

                if (logo.type.isLogoList(v) && logo.type.listLength(v) > 0) {
                    let name = logo.type.listFirst(v);
                    let param = logo.type.listButFirst(v);
                    return logo.type.listUnshift(param, name.toLowerCase());
                }

                throw logo.type.LogoException.INVALID_INPUT.withParam([logo.env.getProcName(), v], logo.env.getProcSrcmap());
            });

            return ret;
        }

        function getFormalSrcmapFromText(text) {
            let srcmap = logo.type.getEmbeddedSrcmap(text);
            if (srcmap === logo.type.SRCMAP_NULL) {
                return logo.type.SRCMAP_NULL;
            }

            return logo.type.unboxList(logo.type.listFirst(srcmap));
        }

        function primitiveNamep(name) {
            logo.env.validateInputWord(name);
            let scope = logo.env.findLogoVarScope(name);
            return (name in scope) && (scope[name] !== undefined);
        }

        function primitiveThing(name) {
            logo.env.validateInputWord(name);
            return logo.env.getVarValue(logo.type.toString(name).toLowerCase(), logo.env.getProcSrcmap());
        }

        function primitivePprop(plist, propName, val) {
            logo.env.validateInputWord(propName);
            propName = logo.type.toInternalPropertyName(propName);
            if (logo.config.get("scopedPlist") && logo.env.canAccessProperties(plist)) {
                logo.type.plistSet(plist, propName, val);
                return;
            }

            logo.env.validateInputWord(plist);
            logo.env.setPlistPropertyValue(plist, propName, val);
        }

        function primitiveGprop(plist, propName) {
            logo.env.validateInputWord(propName);
            propName = logo.type.toInternalPropertyName(propName);
            if (logo.config.get("scopedPlist") && logo.env.canAccessProperties(plist)) {
                return logo.type.plistGet(plist, propName);
            }

            logo.env.validateInputWord(plist);
            return logo.env.getPlistPropertyValue(plist, propName);
        }

        function primitiveRemprop(plist, propName) {
            logo.env.validateInputWord(propName);
            propName = logo.type.toInternalPropertyName(propName);
            if (logo.config.get("scopedPlist") && logo.env.canAccessProperties(plist)) {
                return logo.type.plistUnset(plist, propName);
            }

            logo.env.validateInputWord(plist);
            return logo.env.unsetPlistPropertyValue(plist, propName);
        }

        function primitivePlist(plist) {
            if (logo.config.get("scopedPlist") && logo.env.canAccessProperties(plist)) {
                return logo.type.plistToList(plist);
            }

            logo.env.validateInputWord(plist);
            return logo.env.plistToList(plist);
        }

        function primitiveMake(varname, val) {
            varname = varname.toLowerCase();
            logo.env.findLogoVarScope(varname)[varname] = val;
        }

        function primitiveLocal(...args) {
            let scope = logo.env.curScope();
            args.forEach(varname => scope[varname.toLowerCase()] = undefined);
        }

        function primitiveLocalmake(varname, val) {
            logo.env.curScope()[varname.toLowerCase()] = val;
        }

        function primitiveDefine(procname, text) {
            logo.env.defineLogoProc(procname.toLowerCase(),
                getFormalFromText(text),
                getBodyFromText(text),
                getFormalSrcmapFromText(text),
                getBodySrcmapFromText(text));
        }

        function primitiveDefmacro(procname, text) {
            logo.env.defineLogoProc(procname.toLowerCase(),
                getFormalFromText(text),
                getBodyFromText(text),
                getFormalSrcmapFromText(text),
                getBodySrcmapFromText(text),
                PROC_ATTRIBUTE.MACRO);
        }

        function primitiveTo() {
            throw logo.type.LogoException.NESTED_TO.withParam([], logo.env.getProcSrcmap());
        }

        function primitiveText(procname) {
            return logo.env.getLogoProcText(procname.toLowerCase());
        }

        async function primitiveLoad(name) {
            let src = await logo.logofs.readFile(name);
            await logo.env.logoExec(src, name);
        }

        async function primitiveHelp(topic) {
            try {
                logo.io.call("out", await logo.logofs.readFile("/ucblogo/HELPFILE/" + topic.toLowerCase()));
            } catch (e) {
                if (logo.type.LogoException.is(e) && logo.type.LogoException.CANT_OPEN_FILE.equalsByCode(e)) {
                    throw logo.type.LogoException.NO_HELP_AVAILABLE.withParam([topic], logo.env.getProcSrcmap());
                } else {
                    throw e;
                }
            }
        }

        function primitiveProcedurep(name) {
            return logo.env.isProc(name) && logo.env.isCallableProc(name);
        }

        function primitiveMacrop(name) {
            return logo.env.isMacro(name) && logo.env.isCallableProc(name);
        }

        return ws;
    }
};
