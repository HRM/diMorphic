export function inject(...injected: any[]):(<T extends {new(...args:any[]):{}}>(constructor:T)=>T){
    return <T extends {new(...args:any[]):{}}>(constructor:T)=> {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...injected);
            }
        };
    }
}