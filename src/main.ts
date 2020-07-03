import * as di from './dev/DiContainer';
import * as r from './dev/Reflector'
import {Alpha as testAlpha} from './Classes'

interface azuga{
    test():void;
}

interface omega{
    test():void;
}
interface delta{}

class test1{
    public constructor(){
        console.log("test1 created");
    }
    public test(){
        console.log("test");
    }
}

class test2{
    public constructor(private t:test1[]){
        console.log("test2 created");
    }
    public test(){
        this.t[0].test();
        console.log("test2");
    }
}

class test3{
    public constructor(private t:test2){
        console.log("test3 created");
    }
    public test(){
        this.t.test();
        console.log("test3");
    }
}
class anzung {
    public test(){};
};
class test4 extends anzung{
    public constructor(private t:test1,private t2:test3){
        super();
        console.log("test4 created");
    }
    public test(){
        this.t.test();
        this.t2.test();
        console.log("test4");
    }
}

let diCont= new di.DiContainer();

diCont.registerClassAsSingleton(test1);
diCont.registerClassAsSingleton(test2);
diCont.registerClass(test3);
diCont.registerClass(test4);

diCont.resolveClass(anzung).test();
diCont.resolveClass(anzung).test();

