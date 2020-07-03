"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiContainer = exports.solveParamList = exports.hashFromParamType = exports.subSolveParamList = exports.NotResolvableDependencyError = exports.MissingDependencyError = exports.CircularDependencyError = void 0;
const Reflector_1 = require("./Reflector");
class CircularDependencyError extends Error {
    constructor(typeId1, typeId2) {
        super("Unresolvable circular dependency of " + typeId1.split('_')[0] + " and " + typeId2.split('_')[0]);
    }
}
exports.CircularDependencyError = CircularDependencyError;
CircularDependencyError.type = { symbol: "CircularDependencyError_56ca52e2270419c5136bd03b608b5bcd", interface: false, ancestors: [
        { symbol: "Error_ca24f370844267306bbc638896f8d9ae", interface: true, ancestors: [] }
    ] };
CircularDependencyError.constructorSigniture = [
    { symbol: "string", array: false, kind: 3 },
    { symbol: "string", array: false, kind: 3 }
];
class MissingDependencyError extends Error {
    constructor(dependantTypeId, dependenyId) {
        super("Dependency " + dependenyId.split('_')[0] + " of dependant " + dependantTypeId.split('_')[0]) + " cannot be resolved";
    }
}
exports.MissingDependencyError = MissingDependencyError;
MissingDependencyError.type = { symbol: "MissingDependencyError_4cfaf551394ab16b44202bc72f6ee7a0", interface: false, ancestors: [
        { symbol: "Error_ca24f370844267306bbc638896f8d9ae", interface: true, ancestors: [] }
    ] };
MissingDependencyError.constructorSigniture = [
    { symbol: "string", array: false, kind: 3 },
    { symbol: "string", array: false, kind: 3 }
];
class NotResolvableDependencyError extends Error {
    constructor(symbol) {
        super("Dependency type " + symbol + " cannot be resolved.");
    }
}
exports.NotResolvableDependencyError = NotResolvableDependencyError;
NotResolvableDependencyError.type = { symbol: "NotResolvableDependencyError_14897bff567efff898760fcbec41c9a0", interface: false, ancestors: [
        { symbol: "Error_ca24f370844267306bbc638896f8d9ae", interface: true, ancestors: [] }
    ] };
NotResolvableDependencyError.constructorSigniture = [
    { symbol: "string", array: false, kind: 3 }
];
function ArrayifyParamType(p, arr = true) {
    p.array = arr || p.array;
    return p;
}
function combineToIntersections(ptll, array = false) {
    let result = [];
    if (ptll.length == 1) {
        ptll[0].forEach((pt) => {
            if (Reflector_1.isTypeRef(pt))
                result.push({ array: array, kind: Reflector_1.ParamTypeKind.Intersection, subType: [pt] });
            if (Reflector_1.isIntersection(pt))
                result.push(pt);
        });
        return result;
    }
    let list1 = ptll.pop();
    let list2 = combineToIntersections(ptll);
    list1.forEach((pt1) => {
        if (Reflector_1.isTypeRef(pt1)) {
            list2.forEach((pt2) => {
                result.push({ array: array, kind: Reflector_1.ParamTypeKind.Intersection, subType: [...pt2.subType, pt1] });
            });
        }
        else if (Reflector_1.isIntersection(pt1)) {
            list2.forEach((pt2) => {
                result.push({ array: array, kind: Reflector_1.ParamTypeKind.Intersection, subType: [...pt2.subType, ...pt1.subType] });
            });
        }
    });
    return result;
}
function deconstructIntersection(pt, array = false) {
    if (Reflector_1.isUnion(pt)) {
        let result = [];
        pt.subType.forEach((spt) => {
            if (Reflector_1.isTypeRef(spt)) {
                result.push(ArrayifyParamType({ ...spt }, array));
            }
            else
                result = [...result, ...deconstructIntersection(spt, array)];
        });
        return result;
    }
    else if (Reflector_1.isIntersection(pt)) {
        let interList = [];
        pt.subType.forEach((spt) => {
            if (Reflector_1.isTypeRef(spt))
                interList.push([ArrayifyParamType({ ...spt }, array)]);
            else
                interList.push(deconstructIntersection(spt, array));
        });
        return combineToIntersections(interList, array).map(pt => { pt.subType = [...(new Set(pt.subType)).values()]; return pt; });
    }
    else
        return [];
}
;
function subSolveParamList(pl, array = false, top = false) {
    let result = [];
    pl.forEach((p) => {
        if (Reflector_1.isTypeRef(p))
            result.push(ArrayifyParamType({ ...p }, Reflector_1.isArray(p) || array));
        else if (Reflector_1.isIntersection(p)) {
            if (top)
                result.push({ array: array, kind: Reflector_1.ParamTypeKind.Union, subType: deconstructIntersection(p, Reflector_1.isArray(p) || array) });
            else
                result.push(...deconstructIntersection(p, Reflector_1.isArray(p) || array));
        }
        else if (Reflector_1.isUnion(p)) {
            if (top)
                result.push({ array: array, kind: Reflector_1.ParamTypeKind.Union, subType: subSolveParamList(p.subType, Reflector_1.isArray(p) || array) });
            else
                result.push(...subSolveParamList(p.subType, Reflector_1.isArray(p) || array));
        }
        else if (top)
            result.push({ array: Reflector_1.isArray(p) || array, kind: Reflector_1.ParamTypeKind.Other });
    });
    return result;
}
exports.subSolveParamList = subSolveParamList;
function stringXor(a, b) {
    let result = "";
    const l = Math.min(a.length, b.length);
    for (let i = 0; i < l; ++i) {
        result += String.fromCharCode(a.charCodeAt(i) ^ b.charCodeAt(i));
    }
    result += ((a.length > b.length) ? a : b).substring(l);
    return result;
}
function hashFromParamType(p) {
    let result = p.array ? "a" : "na";
    if (Reflector_1.isIntersection(p)) {
        result += "inter";
        p.subType.forEach(st => result = stringXor(hashFromParamType(st), result));
        return result;
    }
    if (Reflector_1.isUnion(p)) {
        result += "union";
        p.subType.forEach(st => result = stringXor(hashFromParamType(st), result));
        return result;
    }
    if (Reflector_1.isTypeRef(p)) {
        result += "ref";
        result = stringXor(p.symbol, result);
        return result;
    }
    return "other";
}
exports.hashFromParamType = hashFromParamType;
function solveParamList(pl) {
    let unchecked = subSolveParamList(pl, false, true);
    const checker = new Set();
    unchecked.filter((pt) => {
        let hash = hashFromParamType(pt);
        if (checker.has(hash))
            return false;
        checker.add(hash);
        return true;
    });
    return unchecked;
}
exports.solveParamList = solveParamList;
function setFromType(type) {
    let result = new Set();
    let que = [type];
    while (que.length) {
        let last = que.pop();
        result.add(last.symbol);
        last.ancestors.forEach((p) => { que.unshift(p); });
    }
    return result;
}
function createInjectNodeFromClass(cls) {
    let result = { typeSet: null, resolve: null, requirements: null };
    result.typeSet = setFromType(Reflector_1.refDataFromClass(cls).type);
    result.requirements = solveParamList(Reflector_1.refDataFromClass(cls).constructorSigniture);
    result.resolve = (params) => new cls(...params);
    return result;
}
function createSingletonInjectNodeFromClass(cls) {
    let result = { typeSet: null, resolve: null, requirements: null };
    result.typeSet = setFromType(Reflector_1.refDataFromClass(cls).type);
    result.requirements = solveParamList(Reflector_1.refDataFromClass(cls).constructorSigniture);
    let store = null;
    result.resolve = (params) => {
        if (!store) {
            result.requirements = [];
            store = new cls(...params);
            return store;
        }
        else
            return store;
    };
    return result;
}
function createInjectNodeFromObject(obj) {
    let result = { typeSet: null, resolve: null, requirements: null };
    result.typeSet = setFromType(Reflector_1.refDataFromObject(obj).type);
    result.requirements = [];
    result.resolve = () => obj;
    return result;
}
function createInjectNodeFromFunction(cls, func) {
    let result = { typeSet: null, resolve: null, requirements: null };
    result.typeSet = setFromType(Reflector_1.refDataFromClass(cls).type);
    result.requirements = [];
    result.resolve = func;
    return result;
}
class DiContainer {
    constructor() {
        this.nodeMap = new Map();
    }
    registerInjectNode(node) {
        node.typeSet.forEach((key) => {
            let injectArray = this.nodeMap.get(key);
            if (injectArray) {
                injectArray.unshift(node);
            }
            else {
                this.nodeMap.set(key, [node]);
            }
        });
    }
    resolveParamTypeKind(pl, cdpiCheck) {
        if (Reflector_1.isTypeRef(pl)) {
            return this.resolveTypeRefParam(pl, cdpiCheck);
        }
        else if (Reflector_1.isUnion(pl)) {
            return this.resolveUnionParam(pl, cdpiCheck);
        }
        else if (Reflector_1.isIntersection(pl)) {
            return this.resolveIntersectionParam(pl, cdpiCheck);
        }
        else
            return null;
    }
    resolveParamList(pl, cdpiCheck) {
        let result = [];
        if (pl.every((ptype) => {
            let resolved = this.resolveParamTypeKind(ptype, cdpiCheck);
            if (resolved) {
                result.push(resolved);
                return true;
            }
            return false;
        }))
            return result;
        return null;
    }
    resolveTypeRefParam(pt, cdpiCheck) {
        let nodes = this.nodeMap.get(pt.symbol);
        if (!nodes)
            return null;
        let result = [];
        let finder = (injectNode) => {
            let params = this.resolveParamList(injectNode.requirements, cdpiCheck);
            if (params) {
                result.push(injectNode.resolve(params));
                return true;
            }
            else
                return false;
        };
        if (Reflector_1.isArray(pt))
            if (nodes.every(finder))
                return result;
        if (nodes.some(finder))
            return result[0];
        return null;
    }
    resolveUnionParam(pt, cdpiCheck) {
        let result = null;
        if (pt.subType.some(pts => {
            return result = this.resolveParamTypeKind(pts, cdpiCheck);
        }))
            return result;
        return null;
    }
    resolveIntersectionParam(pt, cdpiCheck) {
        let smallest = null;
        let smallestLength = Infinity;
        if (!pt.subType.every((t) => {
            if (this.nodeMap.has(t.symbol)) {
                let sm;
                if ((sm = this.nodeMap.get(t.symbol)).length < smallestLength) {
                    smallestLength = sm.length;
                    smallest = sm;
                }
                return true;
            }
            else
                return false;
        }))
            return null;
        let result = [];
        let finder = (le) => {
            if (!(le.requirements) || pt.subType.every(pt => le.typeSet.has(pt.symbol))) {
                let resolved = this.resolveParamList(le.requirements, cdpiCheck);
                if (resolved) {
                    result.push(le.resolve(resolved));
                    return true;
                }
                return false;
            }
        };
        if (Reflector_1.isArray(pt))
            if (smallest.every(finder))
                return result;
        if (smallest.some(finder))
            return result[0];
        return null;
    }
    registerClass(cls) {
        this.registerInjectNode(createInjectNodeFromClass(cls));
    }
    registerClassAsSingleton(cls) {
        this.registerInjectNode(createSingletonInjectNodeFromClass(cls));
    }
    registerObject(obj) {
        this.registerInjectNode(createInjectNodeFromObject(obj));
    }
    registerProvier(cls, func) {
        this.registerInjectNode(createInjectNodeFromFunction(cls, func));
    }
    resolveClass(cls) {
        return this.resolveTypeRefParam(Reflector_1.createTypeReffFromClass(cls), new Set());
    }
    resolveAllClass(cls) {
        return this.resolveTypeRefParam(Reflector_1.createTypeReffFromClass(cls, true), new Set());
    }
}
exports.DiContainer = DiContainer;
DiContainer.type = { symbol: "DiContainer_d0b6eea2411c963d096faa60bb293f4a", interface: false, ancestors: [] };
DiContainer.constructorSigniture = [];
