//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Implements Logo's arithmetic and logic primitives
// Runs in Logo worker thread

export default {
    "create": function(logo, sys) {
        const al = {};

        const methods = {

            // unary minus operator in ambiguous context
            " -": {jsFunc: primitiveMinus, precedence: 2},

            "-": {jsFunc: primitiveMinus, precedence: 2},

            "minus": primitiveMinus,

            "sum": [primitiveSum, "[args] 2"],

            "difference": primitiveDifference,

            "quotient": primitiveQuotient,

            "product": primitiveProduct,

            "remainder": primitiveRemainder,

            "modulo": primitiveModulo,

            "sqrt": primitiveSqrt,

            "power": primitivePower,

            "exp": primitiveExp,

            "log10": primitiveLog10,

            "ln": primitiveLn,

            "sin": primitiveSin,

            "radsin": primitiveRadsin,

            "cos": primitiveCos,

            "radcos": primitiveRadcos,

            "arctan": [primitiveArctan, "num [y .novalue]"],

            "radarctan": [primitiveRadarctan, "num [y .novalue]"],

            "round": primitiveRound,

            "int": primitiveInt,

            "abs": primitiveAbs,

            "sign": primitiveSign,

            "beforep": primitiveBeforep,
            "before?": primitiveBeforep,

            "lessp": primitiveLessp,
            "less?": primitiveLessp,

            "lessequalp": primitiveLessequalp,
            "lessequal?": primitiveLessequalp,

            "greaterp": primitiveGreaterp,
            "greater?": primitiveGreaterp,

            "greaterequalp": primitiveGreaterequalp,
            "greaterequal?": primitiveGreaterequalp,

            "equalp": primitiveEqualp,
            "equal?": primitiveEqualp,

            "notequalp": primitiveNotequalp,
            "notequal?": primitiveNotequalp,

            "random": [primitiveRandom, "num [num2 .novalue]"],

            "rerandom": [primitiveRerandom, "[seed .novalue]"],

            "iseq": primitiveIseq,

            "and": [primitiveAnd, "[args] 2"],

            "bitand": [primitiveBitand, "[args] 2"],

            "bitxor": [primitiveBitxor, "[args] 2"],

            "or": [primitiveOr, "[args] 2"],

            "not": primitiveNot,

            "bitnot": primitiveBitnot,

            "ashift": primitiveAshift,

            "lshift": primitiveLshift,

            "pi": primitivePi,
        };
        al.methods = methods;

        function primitiveAnd(...args) {
            args.forEach(logo.env.validateInputBoolean);
            return args.reduce((accumulator, currentValue) => accumulator && logo.type.logoBoolean(currentValue), true);
        }

        function primitiveBitand(...args) {
            args.forEach(logo.env.validateInputInteger);
            return args.reduce((accumulator, currentValue) => accumulator & currentValue);
        }

        function primitiveBitxor(...args) {
            args.forEach(logo.env.validateInputInteger);
            return args.reduce((accumulator, currentValue) => accumulator ^ currentValue);
        }

        function primitiveOr(...args) {
            args.forEach(logo.env.validateInputBoolean);
            return args.reduce((accumulator, currentValue) => accumulator || logo.type.logoBoolean(currentValue), false);
        }

        function primitiveNot(value) {
            logo.env.validateInputBoolean(value);
            return !logo.type.logoBoolean(value);
        }

        function primitiveBitnot(value) {
            logo.env.validateInputInteger(value);
            return ~value;
        }

        function primitiveAshift(num1, num2) {
            logo.env.validateInputInteger(num1);
            logo.env.validateInputInteger(num2);
            return (num2 > 0) ? (num1 << num2) :
                (num2 < 0) ? (num1 >> -num2) :
                    num1;
        }

        function primitiveLshift(num1, num2) {
            logo.env.validateInputInteger(num1);
            logo.env.validateInputInteger(num2);
            return (num2 > 0) ? (num1 << num2) :
                (num2 < 0) ? (num1 >>> -num2) :
                    num1;
        }

        function primitiveMinus(a) {
            return -a;
        }

        function primitiveQuotient(opnd1, opnd2) {
            return opnd1 / opnd2;
        }

        function primitiveProduct(opnd1, opnd2) {
            logo.env.validateInputNumber(opnd1);
            logo.env.validateInputNumber(opnd2);
            return opnd1 * opnd2;
        }

        function primitiveRemainder(opnd1, opnd2) {
            logo.env.validateInputNumber(opnd1);
            logo.env.validateInputNonZeroNumber(opnd2);
            return opnd1 % opnd2;
        }

        function primitiveModulo(opnd1, opnd2) {
            let remainder = primitiveRemainder(opnd1, opnd2);
            return (opnd2 > 0 && opnd1 > 0 || opnd2 < 0 && opnd1 < 0) ? remainder : remainder + Number(opnd2);
        }

        function primitiveSum(...args) {
            args.forEach(logo.env.validateInputNumber);
            return args.reduce((accumulator, currentValue) =>
                accumulator + sys.toNumberIfApplicable(currentValue), 0);
        }

        function primitiveDifference(opnd1, opnd2) {
            return opnd1 - opnd2;
        }

        function primitiveSqrt(opnd) {
            logo.env.validateInputNonNegNumber(opnd);
            return Math.sqrt(opnd);
        }

        function primitivePower(base, exp) {
            logo.env.validateInputNumber(base);
            if (base < 0) {
                logo.env.validateInputInteger(exp);
            } else {
                logo.env.validateInputNumber(exp);
            }

            return Math.pow(base, exp);
        }

        function primitiveExp(opnd) {
            logo.env.validateInputNumber(opnd);
            return Math.exp(opnd);
        }

        function primitiveLog10(opnd) {
            logo.env.validateInputPosNumber(opnd);
            return Math.log10(opnd);
        }

        function primitiveLn(opnd) {
            logo.env.validateInputPosNumber(opnd);
            return Math.log(opnd);
        }

        function primitiveSin(deg) {
            logo.env.validateInputNumber(deg);
            return Math.sin(logo.type.degToRad(normalizeDegree(deg)));
        }

        function primitiveRadsin(deg) {
            logo.env.validateInputNumber(deg);
            return Math.sin(deg);
        }

        function normalizeDegree(deg) {
            let degAbs = Math.abs(deg) % 360;
            let degSign = Math.sign(deg);
            if (degAbs > 180) {
                degAbs -= 180;
                degSign = -degSign;
            }

            if (degAbs > 90) {
                degAbs = 180 - degAbs;
            }

            return degSign * degAbs;
        }

        function primitiveCos(deg) {
            logo.env.validateInputNumber(deg);
            return Math.sin(logo.type.degToRad(normalizeDegree(deg + 90)));
        }

        function primitiveRadcos(deg) {
            logo.env.validateInputNumber(deg);
            return Math.cos(deg);
        }

        function primitiveArctan(num, y) {
            return logo.type.radToDeg(primitiveRadarctan(num, y));
        }

        function primitiveRadarctan(num, y) {
            logo.env.validateInputNumber(num);
            if (y === undefined) {
                return Math.atan(num);
            }

            logo.env.validateInputNumber(y);
            return Math.atan2(y, num);
        }

        function primitiveRound(opnd) {
            logo.env.validateInputNumber(opnd);
            let sign = Math.sign(opnd);
            return sign == 0 ? 0 :
                sign > 0 ? Math.round(opnd) :
                    - Math.round(-opnd);
        }

        function primitiveInt(opnd) {
            logo.env.validateInputNumber(opnd);
            let sign = Math.sign(opnd);
            return sign == 0 ? 0 :
                sign > 0 ? Math.floor(opnd) :
                    - Math.floor(-opnd);
        }

        function primitiveAbs(opnd) {
            logo.env.validateInputNumber(opnd);
            return Math.abs(opnd);
        }

        function primitiveSign(opnd) {
            logo.env.validateInputNumber(opnd);
            return Math.sign(opnd);
        }

        function primitiveRandom(num, num2 = undefined) {
            if (num2 === undefined) {
                logo.env.validateInputPosInteger(num);
                return Math.floor(sys.random() * num);
            }

            logo.env.validateInputInteger(num);
            logo.env.validateInputInteger(num2);
            logo.env.throwIf(!(num < num2), logo.type.LogoException.INVALID_RANGE, [num, num2]);
            return Math.floor(sys.random() * (num2 - num + 1)) + num;
        }

        function primitiveRerandom(seed = undefined) {
            if (seed !== undefined) {
                logo.env.validateInputInteger(seed);
            }

            sys.random = new Math.seedrandom(logo.type.toString(seed));
        }

        function primitiveIseq(from, to) {
            logo.env.validateInputNumber(from);
            logo.env.validateInputNumber(to);
            if (from === to) {
                return logo.type.makeLogoList([from]);
            }

            let incr = from < to;
            let length = Math.floor(Math.abs(to - from)) + 1;
            return logo.type.makeLogoList(Array.from({length: length}, (x, i) => (incr ? i : -i) + from));
        }

        function primitiveBeforep(a, b) {
            logo.env.validateInputWord(a);
            logo.env.validateInputWord(b);
            return logo.type.toString(a) < logo.type.toString(b);
        }

        function primitiveLessp(a, b) {
            logo.env.validateInputNumber(a);
            logo.env.validateInputNumber(b);
            return Number(a) < Number(b);
        }

        function primitiveLessequalp(a, b) {
            logo.env.validateInputNumber(a);
            logo.env.validateInputNumber(b);
            return Number(a) <= Number(b);
        }

        function primitiveGreaterp(a, b) {
            logo.env.validateInputNumber(a);
            logo.env.validateInputNumber(b);
            return Number(a) > Number(b);
        }

        function primitiveGreaterequalp(a, b) {
            logo.env.validateInputNumber(a);
            logo.env.validateInputNumber(b);
            return Number(a) >= Number(b);
        }

        function primitiveEqualp(a, b) {
            return logo.type.equal(a, b);
        }

        function primitiveNotequalp(a, b) {
            return !logo.type.equal(a, b);
        }

        function primitivePi() {
            return Math.PI;
        }

        return al;
    }
};
