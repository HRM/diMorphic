import { ReflectionData, ParamType, ParamTypeKind, isArray, isIntersection, isTypeRef, isUnion, Type, refDataFromClass, refDataFromObject, classType, createTypeReffFromClass } from './Reflector'
import { getPositionOfLineAndCharacter, isGetAccessor, isForOfStatement } from 'typescript';


export class CircularDependencyError extends Error {
    public constructor(typeId1: string, typeId2: string) {
        super("Unresolvable circular dependency of " + typeId1.split('_')[0] + " and " + typeId2.split('_')[0]);
    }
}

export class MissingDependencyError extends Error {
    public constructor(dependantTypeId: string, dependenyId: string) {
        super("Dependency " + dependenyId.split('_')[0] + " of dependant " + dependantTypeId.split('_')[0]) + " cannot be resolved";
    }
}

export class NotResolvableDependencyError extends Error {
    public constructor(symbol: string) {
        super("Dependency type " + symbol + " cannot be resolved.");
    }
}


function ArrayifyParamType(p: ParamType, arr: boolean = true): ParamType {
    p.array = arr || p.array;
    return p;
}

function combineToIntersections(ptll: ParamType[][], array = false): ParamType[] {
    let result: ParamType[] = [];
    if (ptll.length == 1) {
        ptll[0].forEach((pt) => {
            if (isTypeRef(pt)) result.push({ array: array, kind: ParamTypeKind.Intersection, subType: [pt] });
            if (isIntersection(pt)) result.push(pt);
        });
        return result;
    }
    let list1 = ptll.pop();
    let list2 = combineToIntersections(ptll);
    list1.forEach((pt1) => {
        if (isTypeRef(pt1)) {
            list2.forEach((pt2) => {
                result.push({ array: array, kind: ParamTypeKind.Intersection, subType: [...pt2.subType, pt1] });
            });
        } else if (isIntersection(pt1)) {
            list2.forEach((pt2) => {
                result.push({ array: array, kind: ParamTypeKind.Intersection, subType: [...pt2.subType, ...pt1.subType] });
            });
        }
    });
    return result;
}

function deconstructIntersection(pt: ParamType, array = false): ParamType[] {
    if (isUnion(pt)) {
        let result: ParamType[] = [];
        pt.subType.forEach((spt) => {
            if (isTypeRef(spt)) {
                result.push(ArrayifyParamType({ ...spt }, array));
            }
            else result = [...result, ...deconstructIntersection(spt, array)];
        });
        return result;
    }
    else if (isIntersection(pt)) {
        let interList: ParamType[][] = [];
        pt.subType.forEach((spt) => {
            if (isTypeRef(spt)) interList.push([ArrayifyParamType({ ...spt }, array)]);
            else interList.push(deconstructIntersection(spt, array));
        });
        return combineToIntersections(interList, array).map(
            pt => { pt.subType = [...(new Set(pt.subType)).values()]; return pt });
    }
    else return [];
};

export function subSolveParamList(pl: ParamType[], array: boolean = false, top: boolean = false): ParamType[] {
    let result: ParamType[] = [];
    pl.forEach((p) => {
        if (isTypeRef(p)) result.push(ArrayifyParamType({ ...p }, isArray(p) || array));
        else if (isIntersection(p)) {
            if (top)
                result.push({ array: array, kind: ParamTypeKind.Union, subType: deconstructIntersection(p, isArray(p) || array) });
            else
                result.push(...deconstructIntersection(p, isArray(p) || array));
        }
        else if (isUnion(p)) {
            if (top)
                result.push({ array: array, kind: ParamTypeKind.Union, subType: subSolveParamList(p.subType, isArray(p) || array) });
            else
                result.push(...subSolveParamList(p.subType, isArray(p) || array));
        }
        else if (top) result.push({ array: isArray(p) || array, kind: ParamTypeKind.Other });
    });
    return result;
}

function stringXor(a: string, b: string): string {
    let result = "";
    const l = Math.min(a.length, b.length);
    for (let i = 0; i < l; ++i) {
        result += String.fromCharCode(a.charCodeAt(i) ^ b.charCodeAt(i));
    }
    result += ((a.length > b.length) ? a : b).substring(l);
    return result;
}

export function hashFromParamType(p: ParamType): string {
    let result: string = p.array ? "a" : "na";
    if (isIntersection(p)) {
        result += "inter";
        p.subType.forEach(st => result = stringXor(hashFromParamType(st), result));
        return result;
    }
    if (isUnion(p)) {
        result += "union";
        p.subType.forEach(st => result = stringXor(hashFromParamType(st), result));
        return result;
    }
    if (isTypeRef(p)) {
        result += "ref";
        result = stringXor(p.symbol, result);
        return result;
    }
    return "other";
}

export function solveParamList(pl: ParamType[]): ParamType[] {
    let unchecked = subSolveParamList(pl, false, true);
    const checker = new Set<string>();
    unchecked.filter((pt) => {
        let hash = hashFromParamType(pt);
        if (checker.has(hash)) return false;
        checker.add(hash);
        return true;
    });
    return unchecked;
}

interface InjectNode {
    readonly resolve: (params?: any[]) => Object;
    readonly requirements: ParamType[];
    readonly typeSet: Set<string>;
}

function setFromType(type: Type): Set<string> {
    let result = new Set<string>();
    let que: Type[] = [type];
    while (que.length) {
        let last = que.pop();
        result.add(last.symbol);
        last.ancestors.forEach((p) => { que.unshift(p); });
    }
    return result;
}

function createInjectNodeFromClass(cls: classType): InjectNode {
    let result = { typeSet: null, resolve: null, requirements: null };
    result.typeSet = setFromType(refDataFromClass(cls).type);
    result.requirements = solveParamList(refDataFromClass(cls).constructorSigniture);
    result.resolve = (params?: any[]) => new cls(...params);
    return result;
}

function createSingletonInjectNodeFromClass(cls: classType): InjectNode {
    let result = { typeSet: null, resolve: null, requirements: null };
    result.typeSet = setFromType(refDataFromClass(cls).type);
    result.requirements = solveParamList(refDataFromClass(cls).constructorSigniture);
    let store = null;
    result.resolve = (params?: any[]) => {
        if (!store) {
            result.requirements = [];
            store = new cls(...params);
            return store;
        }
        else return store;
    };
    return result;
}

function createInjectNodeFromObject(obj: Object): InjectNode {
    let result = { typeSet: null, resolve: null, requirements: null };
    result.typeSet = setFromType(refDataFromObject(obj).type);
    result.requirements = [];
    result.resolve = () => obj;
    return result;
}

function createInjectNodeFromFunction(cls: classType, func: () => Object): InjectNode {
    let result = { typeSet: null, resolve: null, requirements: null };
    result.typeSet = setFromType(refDataFromClass(cls).type);
    result.requirements = [];
    result.resolve = func;
    return result;
}


export class DiContainer {
    nodeMap: Map<string, InjectNode[]> = new Map();

    private registerInjectNode(node: InjectNode) {
        node.typeSet.forEach((key) => {
            let injectArray = this.nodeMap.get(key);
            if (injectArray) {
                injectArray.unshift(node);
            } else {
                this.nodeMap.set(key, [node]);
            }
        })
    }

    private resolveParamTypeKind(pl: ParamType, cdpiCheck: Set<string>): Object | Object[] {
        if (isTypeRef(pl)) {
            return this.resolveTypeRefParam(pl, cdpiCheck);
        }
        else if (isUnion(pl)) {
            return this.resolveUnionParam(pl, cdpiCheck);
        }
        else if (isIntersection(pl)) {
            return this.resolveIntersectionParam(pl, cdpiCheck);
        } else return null;
    }

    private resolveParamList(pl: ParamType[], cdpiCheck: Set<string>): (Object | Object[])[] {
        let result: Object[] = [];
        if(pl.every((ptype) => {
            let resolved = this.resolveParamTypeKind(ptype, cdpiCheck);
            if (resolved) {
                result.push(resolved);
                return true;
            }
            return false;
        }))return result;
        return null;
    }

    private resolveTypeRefParam(pt: ParamType, cdpiCheck: Set<string>): Object | Object[] {
        let nodes: InjectNode[] = this.nodeMap.get(pt.symbol);
        if (!nodes) return null;
            let result: Object[] = [];
            let finder=(injectNode:InjectNode) => {
                let params = this.resolveParamList(injectNode.requirements, cdpiCheck);
                if (params) {
                    result.push(injectNode.resolve(params));
                    return true;
                } else return false;
            };
            if(isArray(pt))if(nodes.every(finder))return result;
            if(nodes.some(finder))return result[0];
            return null;
    }

    private resolveUnionParam(pt: ParamType, cdpiCheck: Set<string>): Object | Object[] {
        let result: Object | Object[] = null;
        if(pt.subType.some(pts=> {
            return result = this.resolveParamTypeKind(pts, cdpiCheck);
        }))return result;
        return null;
    }

    private resolveIntersectionParam(pt: ParamType, cdpiCheck: Set<string>): Object | Object[] {
        let smallest: InjectNode[]=null;
        let smallestLength = Infinity;
       if(!pt.subType.every((t) => {
            if (this.nodeMap.has(t.symbol)) {
                let sm:InjectNode[];
                if ((sm=this.nodeMap.get(t.symbol)).length < smallestLength) {
                    smallestLength=sm.length;
                    smallest=sm;
                }
                return true;
            }else return false;
        })) return null;
        let result:Object[]=[];
        let finder=(le:InjectNode)=>{
            if(!(le.requirements)||pt.subType.every(pt=>le.typeSet.has(pt.symbol))){
                let resolved=this.resolveParamList(le.requirements,cdpiCheck);
                if(resolved){
                    result.push(le.resolve(resolved));
                    return true;
                }
                return false;
            }
        };
        if(isArray(pt))if(smallest.every(finder))return result;
        if(smallest.some(finder))return result[0];
        return null;
    }

    public registerClass(cls: classType) {
        this.registerInjectNode(createInjectNodeFromClass(cls));
    }
    public registerClassAsSingleton(cls: classType) {
        this.registerInjectNode(createSingletonInjectNodeFromClass(cls));
    }
    public registerObject(obj: Object) {
        this.registerInjectNode(createInjectNodeFromObject(obj));
    }
    public registerProvier(cls: classType, func: () => Object) {
        this.registerInjectNode(createInjectNodeFromFunction(cls, func));
    }

    public resolveClass<T>(cls: classType<T>):T{
        return (this.resolveTypeRefParam(createTypeReffFromClass(cls),new Set()) as T);
    }

    public resolveAllClass<T>(cls:classType<T>):T{
        return (this.resolveTypeRefParam(createTypeReffFromClass(cls,true),new Set()) as T);
    }
}