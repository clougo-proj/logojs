//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Implements Logo's control primitives
// Runs in Logo worker thread

export default {
    "create": function(logo, sys) {
        const ctrl = {};

        const PROC_ATTRIBUTE = logo.constants.PROC_ATTRIBUTE;

        const methods = {

            "run": {jsFunc: primitiveRun, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "runresult": {jsFunc: primitiveRunresult, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "macroexpand": {jsFunc: primitiveMacroexpand, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "repeat": {jsFunc: primitiveRepeat, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "while": {jsFunc: primitiveWhile, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "if": {jsFunc: primitiveIf, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "ifelse": {jsFunc: primitiveIfelse, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "catch": {jsFunc: primitiveCatch, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "throw": [primitiveThrow, "tag [value .novalue]"],

            "wait": primitiveWait,

            "ignore": primitiveIgnore,

            "for": {jsFunc: primitiveFor, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "apply": {jsFunc: primitiveApply, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "invoke": {jsFunc: primitiveInvoke, formal: "template [inputs] 2",
                attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "foreach": {jsFunc: primitiveForeach, formal: "[inputs] 2",
                attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "reduce": {jsFunc: primitiveReduce, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "map": {jsFunc: primitiveMap, formal: "template [inputs] 2",
                attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "map.se": {jsFunc: primitiveMapDotSe, formal: "template [inputs] 2",
                attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "crossmap": {jsFunc: primitiveCrossmap, formal: "template [inputs] 2",
                attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "cascade": {jsFunc: primitiveCascade, formal: "template [inputs] 3",
                attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "cascade.2": {jsFunc: primitiveCascade, formal: "template [inputs] 5",
                attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "filter": {jsFunc: primitiveFilter, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "find": {jsFunc: primitiveFind, attributes: PROC_ATTRIBUTE.STASH_LOCAL_VAR | PROC_ATTRIBUTE.RETURNS_IN_LAMBDA},

            "?": [primitiveQuestionMark, "[slotNum 1]"],

            "?rest": [primitiveQuestionMarkRest, "[slotNum 1]"],

            "#": primitiveHashMark,
        };
        ctrl.methods = methods;

        async function primitiveApply(template, inputList) {
            return await applyHelper(template, inputList);
        }

        async function applyHelper(template, inputList, index = 1, unboxedRestList = []) {
            logo.type.validateInputList(inputList);

            let unboxedInputList = logo.type.unbox(inputList);
            let srcmap = logo.env.getProcSrcmap();
            let slot = logo.env.makeSlotObj(unboxedInputList, index, unboxedRestList);

            let inputListSrcmap = logo.type.getEmbeddedSrcmap(inputList);
            if (inputListSrcmap === logo.type.SRCMAP_NULL) {
                inputListSrcmap = srcmap;
            }

            if (logo.type.isLogoWord(template)) {
                return await logo.env.applyNamedProcedure(logo.type.toString(template).toLowerCase(), srcmap, slot, inputListSrcmap);
            }

            logo.type.validateInputList(template);

            if (logo.type.isProcText(template)) {
                return await logo.env.applyProcText(template, srcmap, slot, inputListSrcmap);
            }

            return await logo.env.applyInstrList(template, srcmap, true, slot, inputListSrcmap);
        }

        async function primitiveInvoke(template, ...inputs) {
            return await applyHelper(template, logo.type.makeLogoList(inputs));
        }

        function sameLength(lists) {
            let lengths = lists.map(list => list.length);
            return Math.max.apply(null, lengths) === Math.min.apply(null, lengths);
        }

        async function primitiveForeach(...inputs) {
            let template = inputs.pop();
            inputs.forEach(logo.type.validateInputWordOrList);
            await mapHelper("foreach", template, inputs);
        }

        async function mapHelper(primitiveName, template, inputs) {
            inputs = inputs.map(input => logo.type.isLogoList(input) ? logo.type.unbox(input) : logo.type.toString(input));

            return await applyMultileInputs(primitiveName, inputs, async (val, i) =>
                await applyHelper(template, makeApplyList(val, i), i + 1, makeApplyRest(val, i)));

            function makeApplyList(val, i) {
                return (logo.type.isLogoWord(val)) ?
                    logo.type.makeLogoList(val.map(v => v.charAt(i))) : logo.type.makeLogoList(val.map(v => v[i]));
            }

            function makeApplyRest(val, i) {
                return (logo.type.isLogoWord(val)) ? val.map(v => v.substr(i + 1)) : val.map(v => v.slice(i + 1));
            }

            async function applyMultileInputs(primitiveName, inputs, applyFunction) {
                if (!sameLength(inputs)) {
                    throw logo.type.LogoException.NOT_SAME_LENGTH.withParam([primitiveName], logo.env.getProcSrcmap());
                }

                let length = inputs[0].length;
                let retVal = [];
                for (let i = 0; i < length; i++) {
                    retVal.push(await applyFunction(inputs, i));
                }

                return retVal;
            }
        }

        async function primitiveReduce(template, data) {
            logo.type.validateInputNonEmptyWordOrList(data);
            let unboxedData = splitWordOrUnboxLogoList(data);

            let result = unboxedData.pop();
            while (unboxedData.length > 0) {
                let inputList = logo.type.makeLogoList([unboxedData.pop(), result]);
                result = await applyHelper(template, inputList);
            }

            return result;
        }

        async function primitiveMap(template, ...inputs) {
            inputs.forEach(logo.type.validateInputWordOrList);

            return (logo.type.isLogoWord(inputs[0])) ?
                (await mapHelper("map", template, inputs)).join("") :
                logo.type.makeLogoList(await mapHelper("map", template, inputs));
        }

        async function primitiveMapDotSe(template, ...inputs) {
            inputs.forEach(logo.type.validateInputWordOrList);
            return logo.type.makeLogoList(logo.type.flattenList(await mapHelper("map", template, inputs)));
        }

        async function primitiveCrossmap(template, ...args) {
            if (args.length === 1) {
                logo.type.validateInputWordOrList(args[0]);
                return await crossmapHelper(splitWordOrUnboxLogoList(args[0]));
            }

            return await crossmapHelper(args);

            async function crossmapHelper(inputs) {
                if (inputs.length === 0) {
                    return logo.type.EMPTY_LIST;
                }

                inputs.forEach(logo.type.validateInputWordOrList);
                let mapList = generateCrossMapList(inputs);
                let result = [];
                for (let i = 0; i < mapList.length; i++) {
                    result.push(await applyHelper(template, logo.type.makeLogoList(mapList[i])));
                }

                return logo.type.makeLogoList(result);
            }

            function generateCrossMapList(inputList) { // [[1, 2], [3, 4]] => [[1, 3], [1, 4], [2, 3], [2, 4]]
                return logo.type.unbox(inputList.reduceRight((prev, val) => {
                    prev = splitWordOrUnboxLogoList(prev);
                    val = splitWordOrUnboxLogoList(val);
                    return logo.type.makeLogoList(val.map(item => prependEach(item, prev)).reduce((prev, val) => prev.concat(val)));
                }));
            }

            function prependEach(elem, array) { // (4, [[1], [2]]) => [[4, 1], [4, 2]]
                return array.map((val) => [].concat(elem, val));
            }
        }

        async function primitiveCascade(...args) {
            let [endTestInput, template, value, finalTemplate] = getCascadeInputs();

            if (logo.type.isNonNegInteger(endTestInput)) {
                let loopCount = Number(endTestInput);
                return await cascadeHelper((i) => i < loopCount);
            }

            return await cascadeHelper(async (i) =>
                !logo.type.isLogoBooleanTrue(await applyHelper(endTestInput, logo.type.makeLogoList(value), i + 1)));

            async function cascadeHelper(endTest) {
                let i = 0;
                for (; await endTest(i); i++) {
                    value = await evaluateNextValue(value, i + 1);
                }

                return evaluateFinalValue(i + 1);
            }

            async function evaluateFinalValue(index) {
                if (finalTemplate === undefined) {
                    return value[0];
                }

                return await applyHelper(finalTemplate, logo.type.makeLogoList(value), index);
            }

            async function evaluateNextValue(value, index) {
                let nextValue = [];
                for (let j = 0; j < value.length; j++) {
                    nextValue.push(await applyHelper(template[j], logo.type.makeLogoList(value), index));
                }

                return nextValue;
            }

            function getCascadeInputs() {
                let endTest = args.shift();
                let finalTemplate = undefined;
                if (args.length % 2 === 1) {
                    finalTemplate = args.pop();
                }

                let template = [];
                let startValue = [];

                for (let i = 0; i < args.length / 2; i++) {
                    template.push(args[2 * i]);
                    startValue.push(args[2 * i + 1]);
                }

                return [endTest, template, startValue, finalTemplate];
            }
        }

        async function primitiveFilter(template, data) {
            logo.type.validateInputWordOrList(data);
            if (logo.type.length(data) === 0) {
                return data;
            }

            let isWord = logo.type.isLogoWord(data);
            let unboxedData = splitWordOrUnboxLogoList(data);

            let results = [];
            let srcmap = logo.env.getProcSrcmap();

            for (let i = 0; i < unboxedData.length; i++) {
                let templateReturn = await applyHelper(template, logo.type.makeLogoList([unboxedData[i]]),
                    i + 1, [unboxedData.slice(i + 1)]);

                if (logo.type.isLogoBooleanTrue(templateReturn, "filter", srcmap)) {
                    results.push(unboxedData[i]);
                }
            }

            return isWord ? results.join("") : logo.type.makeLogoList(results);
        }

        function splitWordOrUnboxLogoList(data) {
            return logo.type.isLogoWord(data) ? logo.type.toString(data).split("") : logo.type.unbox(data);
        }

        async function primitiveFind(template, data) {
            logo.type.validateInputWordOrList(data);
            if (logo.type.length(data) === 0) {
                return logo.type.EMPTY_LIST;
            }

            let unboxedData = splitWordOrUnboxLogoList(data);

            let srcmap = logo.env.getProcSrcmap();

            for (let i = 0; i < unboxedData.length; i++) {
                if (logo.type.isLogoBooleanTrue(await applyHelper(template, logo.type.makeLogoList([unboxedData[i]]),
                    i + 1, [unboxedData.slice(i + 1)]), "find", srcmap)) {

                    return unboxedData[i];
                }
            }

            return logo.type.EMPTY_LIST;
        }

        async function primitiveRepeat(count, template) {
            logo.type.validateInputPosNumber(count);
            logo.type.validateInputList(template);

            let srcmap = logo.env.getProcSrcmap();

            for (let i = 0; i < count; i++) {
                let ret = await logo.env.applyInstrList(template, srcmap);
                logo.env.checkUnusedValue(ret, srcmap);
            }
        }

        async function primitiveRun(template, allowRetVal = true) {
            template = logo.type.wordToList(template);
            logo.type.validateInputList(template);
            return await logo.env.callTemplate(template, false, allowRetVal);
        }

        async function primitiveRunresult(template) {
            try {
                let retVal = await primitiveRun(template, true);
                if (retVal === undefined) {
                    return logo.type.EMPTY_LIST;
                }

                return logo.type.makeLogoList([retVal]);
            } catch (e) {
                if (logo.type.LogoException.OUTPUT.equalsByCode(e) || logo.type.LogoException.STOP.equalsByCode(e)) {
                    throw logo.type.LogoException.OUTPUT_STOP_RUNRESULT.withParam([], logo.env.getProcSrcmap());
                }

                throw e;
            }
        }

        async function primitiveMacroexpand(template) {
            template = logo.type.wordToList(template);
            logo.type.validateInputNonEmptyList(template);
            logo.type.validateInputMacro(logo.type.listFirst(template));
            return await logo.env.callTemplate(template, true, true);
        }

        async function primitiveIf(predicate, template) {
            logo.type.validateInputBoolean(predicate);

            template = logo.type.wordToList(template);
            logo.type.validateInputList(template);

            if (logo.type.logoBoolean(predicate)) {
                await logo.env.callTemplate(template);
            }
        }

        async function primitiveWhile(predicate, template) {
            logo.type.validateInputList(predicate);

            template = logo.type.wordToList(template);
            logo.type.validateInputList(template);

            while (await logo.env.callTemplate(predicate, false, true)) {
                await logo.env.callTemplate(template);
            }
        }

        async function primitiveIfelse(predicate, templateTrue, templateFalse) {
            logo.type.validateInputBoolean(predicate);

            templateTrue = logo.type.wordToList(templateTrue);
            templateFalse = logo.type.wordToList(templateFalse);

            logo.type.validateInputList(templateTrue);
            logo.type.validateInputList(templateFalse);

            if (logo.type.logoBoolean(predicate)) {
                return await logo.env.callTemplate(templateTrue, false, true);
            } else {
                return await logo.env.callTemplate(templateFalse, false, true);
            }
        }

        async function primitiveCatch(label, template) {
            logo.type.validateInputWord(label);
            template = logo.type.wordToList(template);
            logo.type.validateInputList(template);

            try {
                let srcmap = logo.env.getProcSrcmap();
                let retVal = await logo.env.applyInstrList(template, srcmap,
                    !logo.type.inSameLine(srcmap, logo.type.getTemplateSrcmap(template)));
                if (logo.config.get("unusedValue")) {
                    logo.env.checkUnusedValue(retVal, logo.type.getTemplateSrcmap(template));
                }
            } catch(e) {
                if (logo.type.LogoException.is(e) && e.isCustom()) {
                    if (sys.equalToken(label, e.getValue()[0])) {
                        return e.getValue()[1];
                    }

                    throw e; // rethrow if tag doesn't match label
                }

                if (!logo.type.LogoException.is(e) || logo.type.LogoException.STOP.equalsByCode(e) ||
                        logo.type.LogoException.OUTPUT.equalsByCode(e) ||
                        (e.isError() && !sys.equalToken(label, "error"))) {
                    throw e;
                }

                // caught and continue execution past catch statement
            }
        }

        function primitiveThrow(tag, value = undefined) {
            throw logo.type.LogoException.CUSTOM.withParam([tag, value], logo.env.getProcSrcmap(), logo.env.getFrameProcName());
        }

        async function primitiveFor(forCtrlComp, bodyComp) {
            let srcmap = logo.env.getProcSrcmap();

            let forCtrlSrcmap = logo.type.getEmbeddedSrcmap(forCtrlComp);
            if (forCtrlSrcmap === logo.type.SRCMAP_NULL) {
                forCtrlSrcmap = srcmap;
            }

            if (logo.type.isLogoList(forCtrlComp)) {
                forCtrlComp = logo.parse.parseBlock(forCtrlComp);
            }

            let evxContext = logo.interpreter.makeEvalContext(forCtrlComp);
            let forVarName = evxContext.getToken();

            await evxForNextNumberExpr(evxContext, forCtrlComp, forCtrlSrcmap);

            let forBegin = sys.toNumberIfApplicable(evxContext.retVal);
            await evxForNextNumberExpr(evxContext, forCtrlComp, forCtrlSrcmap);

            let forEnd = sys.toNumberIfApplicable(evxContext.retVal);
            evxContext.retVal = undefined;
            if (evxContext.hasNext()) {
                await evxForNextNumberExpr(evxContext, forCtrlComp, forCtrlSrcmap);
            }

            let curScope = logo.env.curScope();
            let isDecrease = forEnd < forBegin;
            let forStep = !sys.isUndefined(evxContext.retVal) ? evxContext.retVal : isDecrease ? -1 : 1;

            for (curScope[forVarName] = forBegin;
                (!isDecrease && curScope[forVarName] <= forEnd) || (isDecrease && curScope[forVarName] >= forEnd);
                curScope[forVarName] += forStep) {
                await decorateSrcmap(async () => {
                    let retVal = await logo.interpreter.evxInstrList(bodyComp, undefined, false);
                    if (logo.config.get("unusedValue")) {
                        logo.env.checkUnusedValue(retVal, srcmap);
                    }
                }, srcmap);
            }
        }

        async function evxForNextNumberExpr(evxContext, forCtrlComp, forCtrlSrcmap) {
            await logo.interpreter.evxNextNumberExpr(evxContext, logo.type.LogoException.INVALID_INPUT, ["for", forCtrlComp], forCtrlSrcmap);
        }

        async function decorateSrcmap(func, srcmap) {
            try {
                await func();
            } catch (e) {
                if (logo.type.LogoException.is(e)) {
                    throw e.withParam(e.getValue(),
                        e.getSrcmap() === logo.type.SRCMAP_NULL || logo.env.getFrameProcName() === undefined ? srcmap : e.getSrcmap());
                }

                throw e;
            }
        }

        async function primitiveWait(delay) {
            logo.env.prepareToBeBlocked();
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 50 / 3 * delay);
            });

            return;
        }

        function primitiveIgnore(input) { // eslint-disable-line no-unused-vars
            // Does nothing
        }

        function primitiveQuestionMark(slotNum = 1) {
            return logo.env.getSlotValue(slotNum);
        }

        function primitiveQuestionMarkRest(slotNum = 1) {
            return logo.env.getSlotRestValue(slotNum);
        }

        function primitiveHashMark() {
            return logo.env.getSlotIndex();
        }

        return ctrl;
    }
};
