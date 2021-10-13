"use strict";
// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexerSandbox = void 0;
const path_1 = __importDefault(require("path"));
const common_1 = require("@subql/common");
const x_vm2_1 = require("@subql/x-vm2");
const lodash_1 = require("lodash");
const logger_1 = require("../utils/logger");
const promise_1 = require("../utils/promise");
const DEFAULT_OPTION = {
    console: 'redirect',
    wasm: false,
    sandbox: {},
    require: {
        builtin: process.env.SANDBOX_BUILTIN.split(','),
        context: 'sandbox',
        external: true,
        import: process.env.SANDBOX_IMPORT.split(','),
    },
    wrapper: 'commonjs',
    sourceExtensions: ['js', 'cjs'],
};
const logger = logger_1.getLogger('sandbox');
class IndexerSandbox extends x_vm2_1.NodeVM {
    constructor(option, config) {
        const { root } = option;
        const vmOption = lodash_1.merge({}, DEFAULT_OPTION, {
            require: {
                root,
                resolve: (moduleName) => {
                    return require.resolve(moduleName, { paths: [root] });
                },
            },
        });
        console.debug("Sandbox Options:");
        console.debug(vmOption);
        super(vmOption);
        this.config = config;
        this.injectGlobals(option);
        this.option = option;
        this.script = new x_vm2_1.VMScript(`
      const mappingFunctions = require('${option.entry}');
      module.exports = mappingFunctions[funcName](...args);
    `, path_1.default.join(root, 'sandbox'));
    }
    async securedExec(funcName, args) {
        this.setGlobal('args', args);
        this.setGlobal('funcName', funcName);
        try {
            await promise_1.timeout(this.run(this.script), this.config.timeout);
        }
        catch (e) {
            e.handler = funcName;
            if (this.config.logLevel && common_1.levelFilter('debug', this.config.logLevel)) {
                e.handlerArgs = JSON.stringify(args);
            }
            throw e;
        }
        this.setGlobal('args', []);
        this.setGlobal('funcName', '');
    }
    injectGlobals({ api, store }) {
        this.freeze(store, 'store');
        this.freeze(api, 'api');
        this.freeze(logger, 'logger');
    }
}
exports.IndexerSandbox = IndexerSandbox;
