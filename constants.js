//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

export default {
    MAX_UNDO_DEPTH: 100,
    CLASSNAME: "$CLASSNAME",
    LOGO_EVENT: {
        "BUSY": "busy",
        "READY": "ready",
        "MULTILINE": "multiline",
        "VERTICAL_BAR" : "vbar",
        "CONTINUE": "continue",
        "CANVAS": "canvas",
        "CANVAS_SNAPSHOT": "canvasSnapshot",
        "GET_FOCUS": "getfocus",
        "SET_FOCUS": "setfocus",
        "OUT": "out",
        "OUTN": "outn",
        "ERR": "err",
        "ERRN": "errn",
        "EXIT": "exit",
        "CONFIG": "config",
        "CLEAR_TEXT": "cleartext",
        "EDITOR_LOAD": "editorLoad"
    },
    LOGO_METHOD: {
        "CONSOLE": "console",
        "EXEC": "exec",
        "RUN": "run",
        "TEST": "test",
        "CLEAR_WORKSPACE": "clearWorkspace",
        "TURTLE_UNDO": "turtleUndo",
        "KEYBOARD_EVENT": "keyboardEvent",
        "MOUSE_EVENT": "mouseEvent",
        "RETURN_VALUE": "returnValue"
    },
    LOGO_LIBRARY: {
        "DATA_STRUCT": "ds",
        "COMMM": "comm",
        "ARITHMETIC_LOGIC": "al",
        "GRAPHICS": "graphics",
        "WORKSPACE_MGMT": "ws",
        "CTRL_STRUCT": "ctrl",
        "OS": "os",
        "MISC": "misc",
        "CLOUGO": "clougo"
    },
    LOGO_EXCEPTIONS: {
        STACK_OVERFLOW        : [2, "Stack overflow"],
        NO_OUTPUT             : [5, "{0} didn't output to {1}"],
        NOT_ENOUGH_INPUTS     : [6, "Not enough inputs to {0}"],
        INVALID_INPUT         : [7, "{0} doesn't like {1} as input"],
        TOO_MUCH_INSIDE_PAREN : [8, "Too much inside ()'s"],
        UNACTIONABLE_DATUM    : [9, "You don't say what to do with {0}"],
        VAR_HAS_NO_VALUE      : [11, "{0} has no value"],
        UNEXPECTED_TOKEN      : [12, "Unexpected '{0}'"],
        UNKNOWN_PROC          : [13, "I don't know how to {0}"],
        NESTED_TO             : [23, "Can't use TO inside a procedure"],
        INVALID_MACRO_RETURN  : [29, "Macro {1} returned {0} instead of a list."],
        OUTPUT_STOP_RUNRESULT : [38, "Can't use OUTPUT or STOP inside RUNRESULT"],
        CANT_OPEN_FILE        : [40, "I can't open file {0}"],
        NOT_MACRO             : [101, "{1} is not a macro."],
        INVALID_RANGE         : [1016, "{0} doesn't like {1} as input range."],
        UNKNOWN_PROC_MODULE   : [1017, "{0} can't find method {1}"],
        MODULE_HAS_NO_EXPORT  : [1018, "Module {0} has no export {1}"],
        ONLY_IN_MODULE        : [1019, "Can't use {0} outside a module."],
        NOT_ALLOWD_IN_MODULE  : [1020, "Can't use {0} inside a module."],
        NOT_ENABLED           : [1021, "{0} is not enabled."],
        NOT_SAME_LENGTH       : [1022, "Inputs of {0} have different lengths"],
        TOO_MANY_INPUTS       : [1023, "Too many inputs to {0}"],
        LAST_ERROR_CODE       : [1024],
        NO_HELP_AVAILABLE     : [65531, "No help available on {0}."],
        CUSTOM                : [65532, "Can't find catch tag for {0}"],
        OUTPUT                : [65534, "Can only use output inside a procedure"],
        STOP                  : [65535, "Can only use stop inside a procedure"]
    },
    PROC_ATTRIBUTE: {
        EMPTY                   : 0,
        PRIMITIVE               : 1,
        RETURNS_IN_LAMBDA       : 1 << 1,
        STASH_LOCAL_VAR         : 1 << 2,
        MACRO                   : 1 << 3
    },
    PROC_PARAM: {
        UNLIMITED               : -1,
        DEFAULT_MIN             : 0,
        DEFAULT                 : 0
    },
    // map event.code to Logo key code (matches deprecated event.which)
    KEYBOARD_EVENT_CODE_CODE: {
        "Backspace": 8,
        "Tab": 9,
        "Enter": 13,
        "ShiftLeft": 16,
        "ShiftRight": 16,
        "ControlLeft": 17,
        "ControlRight": 17,
        "AltLeft": 18,
        "AltRight": 18,
        "Pause": 19,
        "CapsLock": 20,
        "Escape": 27,
        "Space": 32,
        "PageUp": 33,
        "PageDown": 34,
        "End": 35,
        "Home": 36,
        "ArrowLeft": 37,
        "ArrowUp": 38,
        "ArrowRight": 39,
        "ArrowDown": 40,
        "PrintScreen": 44,
        "Insert": 45,
        "Delete": 46,
        "Digit0": 48,
        "Digit1": 49,
        "Digit2": 50,
        "Digit3": 51,
        "Digit4": 52,
        "Digit5": 53,
        "Digit6": 54,
        "Digit7": 55,
        "Digit8": 56,
        "Digit9": 57,
        "KeyA": 65,
        "KeyB": 66,
        "KeyC": 67,
        "KeyD": 68,
        "KeyE": 69,
        "KeyF": 70,
        "KeyG": 71,
        "KeyH": 72,
        "KeyI": 73,
        "KeyJ": 74,
        "KeyK": 75,
        "KeyL": 76,
        "KeyM": 77,
        "KeyN": 78,
        "KeyO": 79,
        "KeyP": 80,
        "KeyQ": 81,
        "KeyR": 82,
        "KeyS": 83,
        "KeyT": 84,
        "KeyU": 85,
        "KeyV": 86,
        "KeyW": 87,
        "KeyX": 88,
        "KeyY": 89,
        "KeyZ": 90,
        "MetaLeft": 91,
        "MetaRight": 92,
        "ContextMenu": 93,
        "Numpad0": 96,
        "Numpad1": 97,
        "Numpad2": 98,
        "Numpad3": 99,
        "Numpad4": 100,
        "Numpad5": 101,
        "Numpad6": 102,
        "Numpad7": 103,
        "Numpad8": 104,
        "Numpad9": 105,
        "NumpadMultiply": 106,
        "NumpadAdd": 107,
        "NumpadSubtract": 109,
        "NumpadDecimal": 110,
        "NumpadDivide": 111,
        "F1": 112,
        "F2": 113,
        "F3": 114,
        "F4": 115,
        "F5": 116,
        "F6": 117,
        "F7": 118,
        "F8": 119,
        "F9": 120,
        "F10": 121,
        "F11": 122,
        "F12": 123,
        "NumLock": 144,
        "ScrollLock": 145,
        "Semicolon": 186,
        "Equal": 187,
        "Comma": 188,
        "Minus": 189,
        "Period": 190,
        "Slash": 191,
        "Backquote": 192,
        "BracketLeft": 219,
        "Backslash": 220,
        "BracketRight": 221,
        "Quote": 222
    },
    // map event.key to Logo key code (matches deprecated event.which)
    KEYBOARD_EVENT_KEY_CODE: {
        "AudioVolumeMute": 173,
        "AudioVolumeDown": 174,
        "AudioVolumeUp": 175,
        "LaunchMediaPlayer": 181,
        "LaunchApplication1": 182,
        "LaunchApplication2": 183,
    }
};
