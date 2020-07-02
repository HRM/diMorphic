"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const di = require("./dev/DiContainer");
const r = require("./dev/Reflector");
;
;
;
;
;
;
;
;
;
;
;
class test {
    constructor(tp, t) {
    }
}
test.type = { symbol: "test_9cfe749d52c8b610148087d5b8b69367", interface: false, ancesttors: [] };
test.constructorSigniture = [
    { subType: [
            { symbol: "d_fbef4efb5a74a9e49200f3776092b9e1", array: false, kind: 2 },
            { symbol: "a_7943140236ab1a388e29ff41f7b0eb0f", array: false, kind: 2 },
            { subType: [
                    { symbol: "b_ed049b92def4ac2fa67d38f9a0b29077", array: false, kind: 2 },
                    { symbol: "c_7a9e3201e4f71367152ba07890db55f2", array: false, kind: 2 }
                ], array: false, kind: 1 }
        ], array: false, kind: 0 },
    { subType: [
            { symbol: "b_ed049b92def4ac2fa67d38f9a0b29077", array: false, kind: 2 },
            { subType: [
                    { symbol: "a_7943140236ab1a388e29ff41f7b0eb0f", array: false, kind: 2 },
                    { symbol: "d_fbef4efb5a74a9e49200f3776092b9e1", array: false, kind: 2 }
                ], array: false, kind: 1 },
            { symbol: "c_7a9e3201e4f71367152ba07890db55f2", array: false, kind: 2 }
        ], array: false, kind: 0 }
];
let tp = r.refDataFromClass(test).constructorSigniture;
console.log(di.solveParamList(tp));
