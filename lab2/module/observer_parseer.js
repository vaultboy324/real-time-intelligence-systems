const fs = require('fs');

const config = require('../config/config');

const math = require('mathjs');

module.exports = {
    perfectX: null,
    perfectY: null,
    perfectZ: null,

    map: {},
    keys: [],

    result: {
        x: 0,
        y: 0,
        z: 0,
        deltaT: 0
    },

    lightSpeed: 299792458,

    time: 0,

    eps: 0.0001,

    rinexList: [],

    oldDelta: [],

    eps: 0.000001,

    minSum: 0,

    X: [0, 0, 0, 0],
    dX: [0, 0, 0, 0],

    __parseFile() {
        let contents = fs.readFileSync(`${config.files.observer}`, 'utf8');
        let beforeCoords = contents.indexOf('ANT # / TYPE') + 'ANT # / TYPE'.length + 2;

        let currentIndex = 0;
        let body = contents.substring(beforeCoords);

        let oParameters = {
            currentIndex,
            dataString: body
        };

        this.perfectX = this.__getValue(oParameters);
        console.log(this.perfectX);

        this.dX[0] = this.perfectX;

        this.perfectY = this.__getValue(oParameters);
        console.log(this.perfectY);

        this.dX[1] = this.perfectY;

        this.perfectZ = this.__getValue(oParameters);
        console.log(this.perfectZ);

        this.dX[2] = this.perfectZ;

        let bodyStart = contents.indexOf('END OF HEADER') + 'END OF HEADER'.length + 2;

        currentIndex = 0;
        body = contents.substring(bodyStart);

        oParameters = {
            currentIndex,
            dataString: body
        };

        let year = this.__getValue(oParameters);
        let month = this.__getValue(oParameters);
        let day = this.__getValue(oParameters);
        let hour = this.__getValue(oParameters);
        let minute = this.__getValue(oParameters);
        let second = this.__getValue(oParameters);
        let oDateStruct = {
            year,
            month,
            day,
            hour,
            minute,
            second
        };
        this.time = this.__toJSDate(oDateStruct);
        console.log(this.time);

        let useless = this.__getValue(oParameters);

        let count = this.__getSputnik(oParameters);
        console.log(count);

        for (i = 0; i < count; i++) {
            let key = this.__getSputnik(oParameters);
            this.map[key] = {c: 0};

            this.keys.push(key);
        }

        console.log(this.map);
        console.log(this.keys);

        this.__getValue(oParameters);

        // let counter = 0;
        // for(let key in this.keys){
        //     this.map[key].c = this.__getC(oParameters);
        //     ++counter;
        //     if(counter === 3){
        //         break;
        //     }
        // }

        let BreakException = {};

        try {
            this.keys.forEach((key, index) => {
                this.map[key].c = this.__getC(oParameters);
                if (index === 10) {
                    throw BreakException;
                }
            });
        } catch {
            BreakException
        }
        {

        }

        console.log(this.map);
    },

    __getValue(oParameters) {
        let index = oParameters.currentIndex;
        let sDataString = oParameters.dataString;

        let value = '';

        while (sDataString[index] !== ' ' && sDataString[index] !== '\n') {
            if (sDataString[index] === '-') {
                if (sDataString[index - 1] !== 'D' && value !== '') {
                    break;
                }
            } else if (sDataString[index] === '\n') {
                ++index;
            }
            value += sDataString[index];
            ++index;
        }

        while (sDataString[index] === ' ' || sDataString[index] === '\n') {
            if (sDataString[index] === '\0') {
                return;
            }
            ++index;
        }

        oParameters.currentIndex = index;

        return this.__toFloat(value);
    },

    __getSputnik(oParameters) {
        let index = oParameters.currentIndex;
        let sDataString = oParameters.dataString;

        let result = '';

        while (sDataString[index] <= '0' || sDataString[index] >= '9') {
            ++index;
        }

        while (sDataString[index] >= '0' && sDataString[index] <= '9') {
            result += sDataString[index];
            ++index;
        }

        oParameters.currentIndex = index;

        return this.__toFloat(result);
    },

    __toFloat(value) {
        return parseFloat(value);
    },

    __toJSDate(oParameters) {
        if (oParameters.year >= 92) {
            oParameters.year += 1900
        } else {
            oParameters.year += 2000
        }

        return new Date(oParameters.year, oParameters.month - 1, oParameters.day, oParameters.hour, oParameters.minute, oParameters.second);
    },

    __getC(oParameters) {
        let temp = this.__toFloat(this.__getValue(oParameters));
        while (temp > 10) {
            temp = this.__toFloat(this.__getValue(oParameters));
        }
        temp = this.__toFloat(this.__getValue(oParameters));
        temp = this.__toFloat(this.__getValue(oParameters));

        if (temp < 10) {
            temp = this.__toFloat(this.__getValue(oParameters));
        }

        return temp;
    },

    __createList(rinexData) {
        let result = [];

        let BreakException = {};

        let mustBeRemoved = [];

        try {
            this.keys.forEach((key, index) => {
                if(rinexData[key][0].tOC.getTime() === this.time.getTime())
                {
                    result.push(rinexData[key][0])
                }
                else {
                    mustBeRemoved.push(index);
                }
                if(result.length === 4){
                    throw BreakException
                }
            });
        } catch {

        }

        let counter = 0;
        mustBeRemoved.forEach((element, index)=>{
            this.keys.splice(element - counter, 1);
            ++counter
        });

        return result;
    },

    __getJ(r) {
        let result = [];

        let row = [];
        this.keys.forEach((key, index) => {

            if (index < 4) {

                let element = (this.dX[0] - this.rinexList[index].result.xSVK) / r[index];
                row.push(element);

                element = (this.dX[1] - this.rinexList[index].result.ySVK) / r[index];
                row.push(element);

                element = (this.dX[2] - this.rinexList[index].result.zSVK) / r[index];
                row.push(element);

                element = this.lightSpeed;
                row.push(element);

                result.push(row);
                row = [];
            }
        });

        return result;

    },

    __getR() {
        let result = [];

        this.keys.forEach((key, index) => {
            if (index < 4) {
                let fixedC = this.map[key].c ;

                result.push(fixedC - Math.sqrt(Math.pow(this.dX[0] - this.rinexList[index].result.xSVK, 2) +
                    Math.pow(this.dX[1] - this.rinexList[index].result.ySVK , 2) +
                    Math.pow(this.dX[2] - this.rinexList[index].result.zSVK, 2))  + this.result.deltaT * this.lightSpeed);

            }
        });

        return result;
    },

    __checkEnd(r) {

        let flag = true;

        if (this.minSum === 0) {
            flag = false;
            this.minSum = this.__getSum(r);
        } else {
            let temp = this.__getSum(r);
            if (temp < this.minSum) {
                flag = false;
                this.minSum = temp;
            }
            else {
                debugger;
            }
        }
        return flag;
    },

    __getSum(r) {
        let result = 0;
        r.forEach((element, index) => {
            result += Math.pow(element, 2);
        });

        return result;
    },

    getJson(rinexData) {
        this.__parseFile();

        this.rinexList = this.__createList(rinexData);

        let perfectCoords = [this.perfectX, this.perfectY, this.perfectZ, 0];

        let r = this.__getR();
        let J = this.__getJ(r);

        while (!this.__checkEnd(r)){
            this.dX = math.subtract(this.dX, math.multiply(math.inv(J), r));

            r = this.__getR();
            J = this.__getJ(r);

            // this.dX = math.subtract(this.dX, math.multiply(math.inv(J), r));
        }

        // let r = this.__getR();
        // let J = this.__getJ(r);
        //
        // let dX = math.inv(J);
        // dX = math.multiply(dX, r);
        // this.dX = math.subtract(this.dX, dX);
        //
        // while (!this.__checkEnd(r)){
        //     r = this.__getR();
        //     J = this.__getJ(r);
        //
        //     dX = math.inv(J);
        //     dX = math.multiply(dX, r);
        //     this.dX = math.subtract(this.dX, dX);
        //     debugger;
        //
        //     // let r = this.__getR();
        //     // let J = this.__getJ(r);
        //     //
        //     // let dX = math.inv(J);
        //     // dX = math.multiply(dX, r);
        //     // X = math.subtract(X, dX);
        //     //
        //     // this.result.x = X[0];
        //     // this.result.y = X[1];
        //     // this.result.z = X[2];
        //     // this.result.deltaT = X[3];
        //     //
        //     // console.log(math.subtract(perfectCoords, X));
        // }
        //
        // // let currentVector = [this.result.x, this.result.y, this.result.z, this.result.deltaT];
        // //
        // // let right = math.inv(J);
        // // right = math.multiply(right, r);
        // // let newArr = math.subtract(currentVector, right);
        // //
        // // let perfectCoords = [this.perfectX, this.perfectY, this.perfectZ, 0];
        // //
        // // while (!this.__checkEnd(r)) {
        // //     currentVector = math.subtract(currentVector, newArr);
        // //     // this.result.x = newArr[0];
        // //     // this.result.y = newArr[1];
        // //     // this.result.z = newArr[2];
        // //     // this.result.deltaT = newArr[3];
        // //
        // //     r = this.__getR();
        // //     J = this.__getJ(r);
        // //
        // //     // currentVector = [this.result.x, this.result.y, this.result.z, this.result.deltaT];
        // //
        // //     let right = math.inv(J);
        // //     right = math.multiply(right, r);
        // //     newArr = math.subtract(currentVector, right);
        // //
        // //
        // // }
        //
        return math.subtract(perfectCoords, this.dX);


    },
};