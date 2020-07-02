"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ceta = exports.Beta = exports.Alpha = void 0;
const Inter_1 = require("./Inter");
class Alpha {
    print() {
        console.log("Aplha printed");
    }
}
exports.Alpha = Alpha;
Alpha.type = { symbol: "Alpha_0fea36f7b769591f8e587980dfced40c", interface: false, ancesttors: [] };
Alpha.constructorSigniture = [];
let Beta = class Beta {
    constructor(a) {
        this.a = a;
    }
    print() {
        console.log("Beta printed");
        this.a.print();
    }
};
Beta.type = { symbol: "Beta_6e527fffc62ef77bf13edffdb4724100", interface: false, ancesttors: [
        { symbol: "gamma_09a6718fc2e9c33eac54bf712f2b9036", interface: true, ancesttors: [
                { symbol: "omega_ce4cadd1fef41dafa26a976f06eb87ce", interface: true, ancesttors: [] }
            ] }
    ] };
Beta.constructorSigniture = [
    { symbol: "Alpha_0fea36f7b769591f8e587980dfced40c", array: false, kind: 2 }
];
Beta = __decorate([
    Inter_1.inject(new Alpha())
], Beta);
exports.Beta = Beta;
class Ceta extends Beta {
    constructor(b, c) {
        super();
        this.b = b;
        this.c = c;
    }
}
exports.Ceta = Ceta;
Ceta.type = { symbol: "Ceta_764553753e7d82f300ecc292f79c4fa7", interface: false, ancesttors: [
        { symbol: "Beta_6e527fffc62ef77bf13edffdb4724100", interface: false, ancesttors: [
                { symbol: "gamma_09a6718fc2e9c33eac54bf712f2b9036", interface: true, ancesttors: [
                        { symbol: "omega_ce4cadd1fef41dafa26a976f06eb87ce", interface: true, ancesttors: [] }
                    ] }
            ] },
        { symbol: "gamma_09a6718fc2e9c33eac54bf712f2b9036", interface: true, ancesttors: [
                { symbol: "omega_ce4cadd1fef41dafa26a976f06eb87ce", interface: true, ancesttors: [] }
            ] }
    ] };
Ceta.constructorSigniture = [
    { subType: [
            { symbol: "gamma_09a6718fc2e9c33eac54bf712f2b9036", array: false, kind: 2 },
            { symbol: "Beta_6e527fffc62ef77bf13edffdb4724100", array: false, kind: 2 }
        ], array: false, kind: 1 },
    { subType: [
            { symbol: "gamma_09a6718fc2e9c33eac54bf712f2b9036", array: true, kind: 2 },
            { symbol: "string", array: false, kind: 3 }
        ], array: false, kind: 1 }
];
