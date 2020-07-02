import * as di from './dev/DiContainer';
import * as r from './dev/Reflector'

interface a{};
interface b{};
interface c{};
interface d{};
interface e{};
interface f{};
interface g{};
interface zs{};
interface dzs{};
interface t{};
interface h{};


class test{
    public constructor(tp:d&a&(b|c),t:b&(a|d)&c){

    }
}
let tp=r.refDataFromClass(test).constructorSigniture;
console.log(di.solveParamList(tp));

