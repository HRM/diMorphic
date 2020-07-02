import { SourceFile, Program, ClassDeclaration, forEachChild, Node, SyntaxKind, Identifier, isImportDeclaration, Declaration, isIdentifier, isInterfaceDeclaration, InterfaceDeclaration, isClassDeclaration, createProperty, createModifier, createIdentifier, createArrayLiteral, createObjectLiteral, createPropertyAssignment, createStringLiteral, createTrue, ObjectLiteralExpression, createFalse, createNodeArray, isConstructorDeclaration, isUnionTypeNode, isArrayTypeNode, isTypeReferenceNode, isParenthesizedTypeNode, isIntersectionTypeNode, createNumericLiteral, Expression } from "typescript";
import { MD5 } from 'crypto-js';
import { ParamTypeT, TypeT, ParamTypeKind } from "./Types";

export function transformClasses(sf: SourceFile, program: Program) {
    let classLikes = getClassLikeDeclarations(sf);
    classLikes.forEach((classDec: ClassDeclaration | InterfaceDeclaration) => {
        if (isClassDeclaration(classDec)) {
            let params: ParamTypeT[] = getSignatureFromConstructor(classDec, program);
            addConstructorSignatureToClass(classDec, params);
            let type: TypeT = getType(classDec, program);
            addTypeToClass(classDec, type);
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

function getType(declaration: ClassDeclaration | InterfaceDeclaration, program: Program): TypeT {
    let result: TypeT = { symbol: symbolByDeclaration(declaration), interface: isInterfaceDeclaration(declaration), ancestors: [] };
    if (declaration.heritageClauses) {
        declaration.heritageClauses.forEach((hc) => hc.types.forEach((ta) => {
            if (isIdentifier(ta.expression)) {
                let ancestor = getDeclarationByIdentifier(ta.expression, program);
                if (isClassDeclaration(ancestor) || isInterfaceDeclaration(ancestor)) {
                    result.ancestors.push(getType(ancestor, program));
                }
            }
        }));
    }
    return result;
}

export function typeToAst(type: TypeT): ObjectLiteralExpression{ 
    return createObjectLiteral(
    [
        createPropertyAssignment(
            createIdentifier("symbol"),
            createStringLiteral(type.symbol)
        ),
        createPropertyAssignment(
            createIdentifier("interface"),
            type.interface ? createTrue() : createFalse()
        ),
        createPropertyAssignment(
            createIdentifier("ancesttors"),
            createArrayLiteral(type.ancestors.map(typeToAst), true)
        )
    ],
    false
);
}

function addTypeToClass(classDeclaration: ClassDeclaration, type: TypeT) {
    const elderListProperty = createProperty(
        undefined,
        [createModifier(SyntaxKind.PublicKeyword), createModifier(SyntaxKind.StaticKeyword)],
        createIdentifier("type"),
        undefined,
        undefined,
        typeToAst(type)
    );
    classDeclaration.members = createNodeArray([elderListProperty, ...classDeclaration.members.flat()]);
}

function getSignatureFromConstructor(classDeclaration: ClassDeclaration, program: Program): ParamTypeT[] {
    let result: ParamTypeT[] = [];
    classDeclaration.members.forEach((ce) => {
        if (isConstructorDeclaration(ce)) {
            result = ce.parameters.map((pd) => getParamType(pd.type, program));
        }
    });

    return result;
}

export function getParamType(pt: Node, program: Program, arr: boolean = false): ParamTypeT {
    if (!pt)
        return { symbol: null, array: arr, kind: ParamTypeKind.Other };
    if (isUnionTypeNode(pt)) {
        return { subType: pt.types.map((n) => getParamType(n, program)), array: arr, kind: ParamTypeKind.Union };
    }
    if (isIntersectionTypeNode(pt)) {
        return { subType: pt.types.map((n) => getParamType(n, program)), array: arr, kind: ParamTypeKind.Intersection };
    }
    if (isArrayTypeNode(pt)) {
        return getParamType(pt.elementType, program, true);
    }
    if (isParenthesizedTypeNode(pt)) {
        return getParamType(pt.type, program, arr);
    }
    if (isTypeReferenceNode(pt)) {
        if (isIdentifier(pt.typeName)) {
            let declaration = getDeclarationByIdentifier(pt.typeName, program);
            if (isClassDeclaration(declaration) || isInterfaceDeclaration(declaration)) {
                if (declaration.name) {
                    return { symbol: symbolByDeclaration(declaration), array: arr, kind: ParamTypeKind.TypeRef };
                }
                return { array: arr, kind: ParamTypeKind.Other };
            }
        }
    }
    return { symbol: pt.getText(), array: arr, kind: ParamTypeKind.Other };
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
