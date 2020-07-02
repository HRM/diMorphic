
export enum ParamTypeKind { Intersection = 0, Union = 1, TypeRef = 2, Other = 3 }

export interface TypeT {
    symbol: string;
    interface: boolean;
    ancestors: TypeT[];
}
export interface ParamTypeT {
    subType?: ParamTypeT[] | null;
    symbol?: string | null;
    array: boolean;
    kind: ParamTypeKind;
}
