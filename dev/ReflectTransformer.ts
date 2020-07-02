import { SourceFile, TransformationContext, Program } from "typescript"
import { transformClasses } from "./TransformClasses";

export default function ReflectTransformer(program: Program) {
    return (context: TransformationContext) => {
        return (sf: SourceFile) => {
            transformClasses(sf,program);
            return sf;
        }
    }
}

