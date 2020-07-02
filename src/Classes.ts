import {inject} from './Inter'

export interface omega{}

interface gamma extends omega{
}

export class Alpha{
    public print(){
        console.log("Aplha printed");
    }
}

@inject(new Alpha())
export class Beta implements gamma{
    public constructor(private a?:Alpha){}
    public print(){
        console.log("Beta printed");
        this.a.print();
    }
}

export class Ceta extends Beta implements gamma{
    public constructor(private b:gamma|Beta,private c:gamma[]|string){
        super();
    }
}