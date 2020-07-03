"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const di = require("./dev/DiContainer");
class test1 {
    constructor() {
        console.log("test1 created");
    }
    test() {
        console.log("test");
    }
}
test1.type = { symbol: "test1_7b9c88c0ff7b591f0041c9895da03137", interface: false, ancestors: [] };
test1.constructorSigniture = [];
class test2 {
    constructor(t) {
        this.t = t;
        console.log("test2 created");
    }
    test() {
        this.t[0].test();
        console.log("test2");
    }
}
test2.type = { symbol: "test2_0c0158464450dfcdb84831d11faf677b", interface: false, ancestors: [] };
test2.constructorSigniture = [
    { symbol: "test1_7b9c88c0ff7b591f0041c9895da03137", array: true, kind: 2 }
];
class test3 {
    constructor(t) {
        this.t = t;
        console.log("test3 created");
    }
    test() {
        this.t.test();
        console.log("test3");
    }
}
test3.type = { symbol: "test3_31aad054a2ab9a6d467246d860fb76c5", interface: false, ancestors: [] };
test3.constructorSigniture = [
    { symbol: "test2_0c0158464450dfcdb84831d11faf677b", array: false, kind: 2 }
];
class anzung {
    test() { }
    ;
}
anzung.type = { symbol: "anzung_eb30f846c36e49ed8cec2715480223eb", interface: false, ancestors: [] };
anzung.constructorSigniture = [];
;
class test4 extends anzung {
    constructor(t, t2) {
        super();
        this.t = t;
        this.t2 = t2;
        console.log("test4 created");
    }
    test() {
        this.t.test();
        this.t2.test();
        console.log("test4");
    }
}
test4.type = { symbol: "test4_a84bd079654017f3c7ff7ca9079b408d", interface: false, ancestors: [
        { symbol: "anzung_eb30f846c36e49ed8cec2715480223eb", interface: false, ancestors: [] }
    ] };
test4.constructorSigniture = [
    { symbol: "test1_7b9c88c0ff7b591f0041c9895da03137", array: false, kind: 2 },
    { symbol: "test3_31aad054a2ab9a6d467246d860fb76c5", array: false, kind: 2 }
];
let diCont = new di.DiContainer();
diCont.registerClassAsSingleton(test1);
diCont.registerClassAsSingleton(test2);
diCont.registerClass(test3);
diCont.registerClass(test4);
diCont.resolveClass(anzung).test();
diCont.resolveClass(anzung).test();
