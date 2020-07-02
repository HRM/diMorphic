"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = void 0;
function inject(...injected) {
    return (constructor) => {
        return class extends constructor {
            constructor(...args) {
                super(...injected);
            }
        };
    };
}
exports.inject = inject;
