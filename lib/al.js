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

            "log10": primitiveLog10,

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

            "lessp": primitiveLessp,

            "lessequalp": primitiveLessequalp,

            "greaterp": primitiveGreaterp,

            "greaterequalp": primitiveGreaterequalp,

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
            args.forEach(logo.type.validateInputBoolean);
            return args.reduce((accumulator, currentValue) => accumulator && logo.type.logoBoolean(currentValue), true);
        }

        function primitiveBitand(...args) {
            args.forEach(logo.type.validateInputInteger);
            return args.reduce((accumulator, currentValue) => accumulator & currentValue);
        }

        function primitiveBitxor(...args) {
            args.forEach(logo.type.validateInputInteger);
            return args.reduce((accumulator, currentValue) => accumulator ^ currentValue);
        }

        function primitiveOr(...args) {
            args.forEach(logo.type.validateInputBoolean);
            return args.reduce((accumulator, currentValue) => accumulator || logo.type.logoBoolean(currentValue), false);
        }

        function primitiveNot(value) {
            logo.type.validateInputBoolean(value);
            return !logo.type.logoBoolean(value);
        }

        function primitiveBitnot(value) {
            logo.type.validateInputInteger(value);
            return ~value;
        }

        function primitiveAshift(num1, num2) {
            logo.type.validateInputInteger(num1);
            logo.type.validateInputInteger(num2);
            return (num2 > 0) ? (num1 << num2) :
                (num2 < 0) ? (num1 >> -num2) :
                    num1;
        }

        function primitiveLshift(num1, num2) {
            logo.type.validateInputInteger(num1);
            logo.type.validateInputInteger(num2);
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
            logo.type.validateInputNumber(opnd1);
            logo.type.validateInputNumber(opnd2);
            return opnd1 * opnd2;
        }

        function primitiveRemainder(opnd1, opnd2) {
            logo.type.validateInputNumber(opnd1);
            logo.type.validateInputNonZeroNumber(opnd2);
            return opnd1 % opnd2;
        }

        function primitiveModulo(opnd1, opnd2) {
            let remainder = primitiveRemainder(opnd1, opnd2);
            return (opnd2 > 0 && opnd1 > 0 || opnd2 < 0 && opnd1 < 0) ? remainder : remainder + Number(opnd2);
        }

        function primitiveSum(...args) {
            args.forEach(logo.type.validateInputNumber);
            return args.reduce((accumulator, currentValue) =>
                accumulator + sys.toNumberIfApplicable(currentValue), 0);
        }

        function primitiveDifference(opnd1, opnd2) {
            return opnd1 - opnd2;
        }

        function primitiveSqrt(opnd) {
            logo.type.validateInputNonNegNumber(opnd);
            return Math.sqrt(opnd);
        }

        function primitivePower(base, exp) {
            logo.type.validateInputNumber(base);
            if (base < 0) {
                logo.type.validateInputInteger(exp);
            } else {
                logo.type.validateInputNumber(exp);
            }

            return Math.pow(base, exp);
        }

        function primitiveLog10(opnd) {
            logo.type.validateInputPosNumber(opnd);
            return Math.log10(opnd);
        }

        function primitiveSin(deg) {
            logo.type.validateInputNumber(deg);
            return Math.sin(logo.type.degToRad(normalizeDegree(deg)));
        }

        function primitiveRadsin(deg) {
            logo.type.validateInputNumber(deg);
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
            logo.type.validateInputNumber(deg);
            return Math.sin(logo.type.degToRad(normalizeDegree(deg + 90)));
        }

        function primitiveRadcos(deg) {
            logo.type.validateInputNumber(deg);
            return Math.cos(deg);
        }

        function primitiveArctan(num, y) {
            return logo.type.radToDeg(primitiveRadarctan(num, y));
        }

        function primitiveRadarctan(num, y) {
            logo.type.validateInputNumber(num);
            if (y === undefined) {
                return Math.atan(num);
            }

            logo.type.validateInputNumber(y);
            return Math.atan2(y, num);
        }

        function primitiveRound(opnd) {
            logo.type.validateInputNumber(opnd);
            let sign = Math.sign(opnd);
            return sign == 0 ? 0 :
                sign > 0 ? Math.round(opnd) :
                    - Math.round(-opnd);
        }

        function primitiveInt(opnd) {
            logo.type.validateInputNumber(opnd);
            let sign = Math.sign(opnd);
            return sign == 0 ? 0 :
                sign > 0 ? Math.floor(opnd) :
                    - Math.floor(-opnd);
        }

        function primitiveAbs(opnd) {
            logo.type.validateInputNumber(opnd);
            return Math.abs(opnd);
        }

        function primitiveSign(opnd) {
            logo.type.validateInputNumber(opnd);
            return Math.sign(opnd);
        }

        function primitiveRandom(num, num2 = undefined) {
            if (num2 === undefined) {
                logo.type.validateInputPosInteger(num);
                return Math.floor(sys.random() * num);
            }

            logo.type.validateInputInteger(num);
            logo.type.validateInputInteger(num2);
            logo.type.throwIf(!(num < num2), logo.type.LogoException.INVALID_RANGE, [num, num2]);
            return Math.floor(sys.random() * (num2 - num + 1)) + num;
        }

        function primitiveRerandom(seed = undefined) {
            if (seed !== undefined) {
                logo.type.validateInputInteger(seed);
            }

            sys.random = new Math.seedrandom(logo.type.toString(seed));
        }

        function primitiveIseq(from, to) {
            logo.type.validateInputNumber(from);
            logo.type.validateInputNumber(to);
            if (from === to) {
                return logo.type.makeLogoList([from]);
            }

            let incr = from < to;
            let length = Math.floor(Math.abs(to - from)) + 1;
            return logo.type.makeLogoList(Array.from({length: length}, (x, i) => (incr ? i : -i) + from));
        }

        function primitiveLessp(a, b) {
            return a < b;
        }

        function primitiveLessequalp(a, b) {
            return a <= b;
        }

        function primitiveGreaterp(a, b) {
            return a > b;
        }

        function primitiveGreaterequalp(a, b) {
            return a >= b;
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
