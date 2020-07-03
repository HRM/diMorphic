
export enum ParamTypeKind { Intersection = 0, Union = 1, TypeRef = 2, Other = 3 }

export interface classType<T extends Object = Object>{
    new(...args:any):T;
}

export interface Type {
    symbol: string;
    interface: boolean;
    ancestors: Type[];
}
export interface ParamType {
    subType?: ParamType[] | null
    symbol?: string | null;
    array: boolean;
    kind: ParamTypeKind;
}

export function createTypeReffFromClass(cls:classType,all:boolean = false):ParamType{
    return {symbol: refDataFromClass(cls).type.symbol,array:all,kind: ParamTypeKind.TypeRef};
}

export interface ReflectionData{
    constructorSigniture:ParamType[];
    type:Type;
}

export function refDataFromClass(cls:classType):ReflectionData{
    if((cls as any).type){
        return <ReflectionData><unknown>cls;
    }
}
export function refDataFromObject(ob:object):ReflectionData{
    return refDataFromClass((ob as any).constructor);
}

export function isTypeRef(pt:ParamType):boolean{
    return pt.kind==ParamTypeKind.TypeRef
}

export function isArray(pt:ParamType):boolean{
    return pt.array
}

export function isIntersection(pt:ParamType):boolean{
    return pt.kind==ParamTypeKind.Intersection
}

export function isUnion(pt:ParamType):boolean{
    return pt.kind==ParamTypeKind.Union
}