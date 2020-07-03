"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUnion = exports.isIntersection = exports.isArray = exports.isTypeRef = exports.refDataFromObject = exports.refDataFromClass = exports.createTypeReffFromClass = exports.ParamTypeKind = void 0;
var ParamTypeKind;
(function (ParamTypeKind) {
    ParamTypeKind[ParamTypeKind["Intersection"] = 0] = "Intersection";
    ParamTypeKind[ParamTypeKind["Union"] = 1] = "Union";
    ParamTypeKind[ParamTypeKind["TypeRef"] = 2] = "TypeRef";
    ParamTypeKind[ParamTypeKind["Other"] = 3] = "Other";
})(ParamTypeKind = exports.ParamTypeKind || (exports.ParamTypeKind = {}));
function createTypeReffFromClass(cls, all = false) {
    return { symbol: refDataFromClass(cls).type.symbol, array: all, kind: ParamTypeKind.TypeRef };
}
exports.createTypeReffFromClass = createTypeReffFromClass;
function refDataFromClass(cls) {
    if (cls.type) {
        return cls;
    }
}
exports.refDataFromClass = refDataFromClass;
function refDataFromObject(ob) {
    return refDataFromClass(ob.constructor);
}
exports.refDataFromObject = refDataFromObject;
function isTypeRef(pt) {
    return pt.kind == ParamTypeKind.TypeRef;
}
exports.isTypeRef = isTypeRef;
function isArray(pt) {
    return pt.array;
}
exports.isArray = isArray;
function isIntersection(pt) {
    return pt.kind == ParamTypeKind.Intersection;
}
exports.isIntersection = isIntersection;
function isUnion(pt) {
    return pt.kind == ParamTypeKind.Union;
}
exports.isUnion = isUnion;
