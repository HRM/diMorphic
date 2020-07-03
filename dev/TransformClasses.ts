import { SourceFile, Program, ClassDeclaration, forEachChild, Node, SyntaxKind, Identifier, isImportDeclaration, Declaration, isIdentifier, isInterfaceDeclaration, InterfaceDeclaration, isClassDeclaration, createProperty, createModifier, createIdentifier, createArrayLiteral, createObjectLiteral, createPropertyAssignment, createStringLiteral, createTrue, ObjectLiteralExpression, createFalse, createNodeArray, isConstructorDeclaration, isUnionTypeNode, isArrayTypeNode, isTypeReferenceNode, isParenthesizedTypeNode, isIntersectionTypeNode, createNumericLiteral, Expression, Type, InterfaceType, TypeFlags } from "typescript";
import { MD5 } from 'crypto-js';
import { ParamTypeT, TypeT, ParamTypeKind } from "./Types";
import * as util from 'util'

export function transformClasses(sf: SourceFile, program: Program) {
    let classLikes = getClassLikeDeclarations(sf);
    classLikes.forEach((classDec: ClassDeclaration | InterfaceDeclaration) => {
        if (isClassDeclaration(classDec)) {
            let params: ParamTypeT[] = getSignatureFromConstructor(classDec, program);
            addConstructorSignatureToClass(classDec, params);
            let types: string[] = getType(classDec, program);
            addTypeToClass(classDec, types);
        }
    });
}

function getClassLikeDeclarations(node: Node): (ClassDeclaration | InterfaceDeclaration)[] {
    let result: (ClassDeclaration | InterfaceDeclaration)[] = [];
    if (isClassDeclaration(node) || isInterfaceDeclaration(node)) {
        result.push(node);
    }
    forEachChild(node, (n: Node) => { result = result.concat(getClassLikeDeclarations(n)); return 0; });
    return result;
}

function getDeclarationByIdentifier(identifier: Identifier, program: Program): Declaration {
    let idSymbol = program.getTypeChecker().getSymbolAtLocation(identifier);
    if (!isImportDeclaration(idSymbol.getDeclarations()[0]))
        return idSymbol.getDeclarations()[0];
    let source = program.getTypeChecker().getAliasedSymbol(idSymbol).getDeclarations()[0];
    return source;
}

function getType(declaration: ClassDeclaration | InterfaceDeclaration, program: Program): string[] {
    let result: string[] = [];
    let type=program.getTypeChecker().getTypeAtLocation(declaration);
    result.push(symbolByDeclaration(declaration));
    type.getBaseTypes().forEach(t=>{
        if(t.isClassOrInterface()){
            result.push(symbolByDeclaration(getDeclarationFromType(t)));
        }
    })
    
    return result;
}

function addTypeToClass(classDeclaration: ClassDeclaration, types: string[]) {
    const elderListProperty = createProperty(
        undefined,
        [createModifier(SyntaxKind.PublicKeyword), createModifier(SyntaxKind.StaticKeyword)],
        createIdentifier("types"),
        undefined,
        undefined,
        createArrayLiteral(types.map((s)=>createStringLiteral(s)), true)
    );
    classDeclaration.members = createNodeArray([elderListProperty, ...classDeclaration.members.flat()]);
}

function isArrayType(t: Type): t is ArrayType {
    return t.symbol && t.symbol.name == "Array";
}
interface ArrayType extends Type {
    resolvedTypeArguments: Type[];
}

function getSignatureFromConstructor(classDeclaration: ClassDeclaration, program: Program): ParamTypeT[] {
    let result: ParamTypeT[] = [];
    classDeclaration.members.forEach((ce) => {
        if (isConstructorDeclaration(ce)) {
            ce.parameters.forEach((p) => {
                let type = program.getTypeChecker().getTypeAtLocation(p);
                result.push(getParamType(type,program));
            });
        }
    });

    return result;
}

function getDeclarationFromType(t: InterfaceType): ClassDeclaration | InterfaceDeclaration {
    let result: ClassDeclaration | InterfaceDeclaration = null;
    if (t.symbol.declarations.some(d => {
        if (isClassDeclaration(d) || isInterfaceDeclaration(d)) {
            result = d;
            return true;
        }
        return false;

    })) return result;
    return null;
}

export function getParamType(pt: Type, program: Program, arr: boolean = false): ParamTypeT {
    if (!pt)
        return { symbol: null, array: arr, kind: ParamTypeKind.Other };
    if (pt.isUnion()) {
        return { subType: pt.types.map((n) => getParamType(n, program,arr)), array: arr, kind: ParamTypeKind.Union };
    }
    if (pt.isIntersection()) {
        return { subType: pt.types.map((n) => getParamType(n, program,arr)), array: arr, kind: ParamTypeKind.Intersection };
    }
    if (isArrayType(pt)) {
        return getParamType(pt.resolvedTypeArguments[0], program, true);
    }
    if (pt.isClassOrInterface()) {
        let declaration = getDeclarationFromType(pt);
        if (isClassDeclaration(declaration) || isInterfaceDeclaration(declaration)) {
            if (declaration.name) {
                return { symbol: symbolByDeclaration(declaration), array: arr, kind: ParamTypeKind.TypeRef };
            }
            return { array: arr, kind: ParamTypeKind.Other };
        }
    }
    return { symbol: program.getTypeChecker().typeToString(pt), array: arr, kind: ParamTypeKind.Other };
}

export function paramTypeToAST(param: ParamTypeT): ObjectLiteralExpression {
    if (param.kind > 1) {
        return createObjectLiteral(
            [
                createPropertyAssignment(
                    createIdentifier("symbol"),
                    createStringLiteral(param.symbol)
                ),
                createPropertyAssignment(
                    createIdentifier("array"),
                    param.array ? createTrue() : createFalse()
                ),
                createPropertyAssignment(
                    createIdentifier("kind"),
                    createNumericLiteral(param.kind.toString())
                )
            ],
            false
        );
    }
    else {
        return createObjectLiteral(
            [
                createPropertyAssignment(
                    createIdentifier("subType"),
                    createArrayLiteral(param.subType?.map(paramTypeToAST), true)
                ),
                createPropertyAssignment(
                    createIdentifier("array"),
                    param.array ? createTrue() : createFalse()
                ),
                createPropertyAssignment(
                    createIdentifier("kind"),
                    createNumericLiteral(param.kind.toString())
                )
            ],
            false
        );
    }
}

function addConstructorSignatureToClass(classDeclaration: ClassDeclaration, params: ParamTypeT[]) {
    let paramTypeProp = createProperty(
        undefined,
        [
            createModifier(SyntaxKind.PublicKeyword),
            createModifier(SyntaxKind.StaticKeyword)
        ],
        createIdentifier("constructorSigniture"),
        undefined,
        undefined,
        createArrayLiteral(
            params.map(paramTypeToAST),
            true));

    classDeclaration.members = createNodeArray([...classDeclaration.members, paramTypeProp]);
}
function symbolByDeclaration(dec: ClassDeclaration | InterfaceDeclaration): string {
    let name = "";
    name = dec.name?.getText();
    return name + "_" + MD5(dec.getText());
}
