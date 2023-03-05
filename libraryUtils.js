//-------------------------------------------------------------------------------------------------------
// Copyright (C) Clougo Project. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

// Interface of inter-process calls

export default (() => {
    const LibraryUtils = {};

    function getLibrarySignature(lib) {
        let signature = {};
        Object.keys(lib).forEach(key => signature[key] = lib[key].length);
        return signature;
    }
    LibraryUtils.getLibrarySignature = getLibrarySignature;

    function createProxyLibrary(signature, caller) {
        let proxyLibrary = {};
        Object.keys(signature).forEach((method) => {
            proxyLibrary[method] = async (...args) => {
                return await caller(method, args);
            };
        });

        return proxyLibrary;
    }
    LibraryUtils.createProxyLibrary = createProxyLibrary;

    return LibraryUtils;
})();
