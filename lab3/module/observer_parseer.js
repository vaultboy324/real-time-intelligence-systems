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

    eps: 1e-6,

    rinexList: [],

    oldDelta: [],

    minSum: 0,

    X: [0, 0, 0, 1],
    dX: [0, 0, 0, 1],

    MoR: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 1]
    ],

    resX: [],
    resR: [],

    genericKeys: [],

    calcObs: {
        perfectX: null,
        perfectY: null,
        perfectZ: null,
        map: {},
        keys: [],
        time: 0,
    },

    __createCalcObject(fileName) {
        let contents = fs.readFileSync(fileName, 'utf8');
        let beforeCoords = contents.indexOf('ANT # / TYPE') + 'ANT # / TYPE'.length + 2;
        if (contents[beforeCoords] === ' ') {
            ++beforeCoords;
        }

        let currentIndex = 0;
        let body = contents.substring(beforeCoords);

        let oParameters = {
            currentIndex,
            dataString: body
        };

        this.calcObs.perfectX = this.__getValue(oParameters);
        this.calcObs.perfectY = this.__getValue(oParameters);
        this.calcObs.perfectZ = this.__getValue(oParameters);

        let bodyStart = contents.indexOf('END OF HEADER') + 'END OF HEADER'.length + 2;

        currentIndex = 0;
        body = contents.substring(bodyStart);

        let bodyArr = body.split("\n");

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
        this.calcObs.time = this.__toJSDate(oDateStruct);
        console.log(this.time);

        let useless = this.__getValue(oParameters);

        let count = this.__getSputnik(oParameters);
        console.log(count);

        for (i = 0; i < count; i++) {
            let key = this.__getSputnik(oParameters);
            this.calcObs.map[key] = {c: 0};
            this.calcObs.keys.push(key);
        }

        this.__getValue(oParameters);

        let firstRow = 2;

        this.calcObs.keys.forEach((key, index) => {
            let rowNum = firstRow + index;
            if (this.calcObs.map[key] && this.calcObs.map[key].c === 0) {
                this.calcObs.map[key].c = this.__getC1(bodyArr[rowNum]);
                while (this.calcObs.map[key].c === undefined) {
                    ++rowNum;
                    this.calcObs.map[key].c = this.__getC1(bodyArr[rowNum]);
                }
            }
        });
    },

    __parseFile(fileName) {
        let contents = fs.readFileSync(fileName, 'utf8');
        let beforeCoords = contents.indexOf('ANT # / TYPE') + 'ANT # / TYPE'.length + 2;
        if (contents[beforeCoords] === ' ') {
            ++beforeCoords;
        }

        let currentIndex = 0;
        let body = contents.substring(beforeCoords);

        let oParameters = {
            currentIndex,
            dataString: body
        };

        this.perfectX = this.__getValue(oParameters);
        this.perfectY = this.__getValue(oParameters);
        this.perfectZ = this.__getValue(oParameters);

        // this.X[2] = this.perfectZ;

        let bodyStart = contents.indexOf('END OF HEADER') + 'END OF HEADER'.length + 2;

        currentIndex = 0;
        body = contents.substring(bodyStart);

        let bodyArr = body.split("\n");

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

        this.__getValue(oParameters);

        let firstRow = 2;

        this.keys.forEach((key, index) => {
            let rowNum = firstRow + index;
            if (this.map[key] && this.map[key].c === 0) {
                this.map[key].c = this.__getC1(bodyArr[rowNum]);
                while (this.map[key].c === undefined) {
                    ++rowNum;
                    this.map[key].c = this.__getC1(bodyArr[rowNum]);
                }
            }
        });

        console.log(this.map);
    },

    __getC1(string) {
        let result = "";
        let temp = "";

        let index = 15;

        console.log(string[index]);
        if (string[index] === ' ') {
            ++index;
            if (string[index] !== '3') {
                return;
            }
        } else {
            index = 29;
            console.log(string[index]);
            if (string[index] !== '3') {
                ++index;
                if (string[index] !== '3') {
                    return;
                }
            }
        }

        index += 2;

        if (string[index] < '0' || string[index] > '9') {
            ++index;
        }

        while ((string[index] >= '0' && string[index] <= '9') || string[index] === '.') {
            temp += string[index];
            ++index;
        }

        // result[result.length - 4] = '.';
        for (let i = 0; i < temp.length; ++i) {
            if (i === temp.length - 3) {
                result += ".";
            }
            result += temp[i];
        }

        return this.__toFloat(result);
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
            if (sDataString[index] === 'R' || sDataString[index] === 'S' || sDataString[index] === 'E') {
                index += 3;
                oParameters.currentIndex = index;
                return;
            }
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

        this.keys.forEach((key, index) => {
            if (rinexData[key] && (rinexData[key][0].tOC.getTime() === this.time.getTime())) {
                result.push(rinexData[key][0])
            } else {
                mustBeRemoved.push(index);
            }
            // if(result.length === 4){
            //     throw BreakException
            // }
        });

        let counter = 0;
        mustBeRemoved.forEach((element, index) => {
            this.keys.splice(element - counter, 1);
            ++counter
        });

        return result;
    },

    __prepareData() {
        this.keys.forEach((key, index) => {
            // if(index < 4) {
            let fixedC = this.map[key].c;

            let t = this.rinexList[index].result.tOE;

            fixedC += this.rinexList[index].result.offset * this.lightSpeed;

            let MoR = JSON.parse(JSON.stringify(this.MoR));

            let AoR = -fixedC * this.rinexList[index].result.omega3 / this.lightSpeed;
            MoR[1][1] = MoR[0][0] = math.cos(AoR);
            MoR[0][1] = math.sin(AoR);
            MoR[1][0] = -MoR[0][1];

            this.resR.push(fixedC);
            this.resX.push(math.multiply([
                this.rinexList[index].result.xSVK,
                this.rinexList[index].result.ySVK,
                this.rinexList[index].result.zSVK
            ], MoR))
            // }
        });
    },

    __getJ(r) {
        let result = [];

        let row = [];
        this.genericKeys.forEach((key, index) => {

            // if (index < 4) {

            let funcResult = this.__getFuncResult({
                X: this.X,
                xSVK: this.resX[index][0],
                ySVK: this.resX[index][1],
                zSVK: this.resX[index][2],
                deltaT: this.result.deltaT
            });

            let element = this.__getDerivativeNumenator({
                arg: this.X[0],
                coord: this.resX[index][0],
            }) / funcResult;
            row.push(element);

            element = this.__getDerivativeNumenator({
                arg: this.X[1],
                coord: this.resX[index][1],
            }) / funcResult;
            row.push(element);

            element = this.__getDerivativeNumenator({
                arg: this.X[2],
                coord: this.resX[index][2],
            }) / funcResult;
            row.push(element);

            element = 1;
            row.push(element);

            result.push(row);

            row = [];
            // }
        });

        return result;

    },

    __getR() {
        let result = [];

        this.genericKeys.forEach((key, index) => {
            // if (index < 4) {

            let fixedC = this.calcObs.map[key].c;

            let t = this.rinexList[index].result.tOE;

            if (this.resX.length === 0) {
                let AoR = -fixedC * this.rinexList[index].omega3 / this.lightSpeed;
                this.MoR[1][1] = this.MoR[0][0] = math.cos(AoR);
            }

            let delta = this.map[key].c - this.__getFuncResult({
                X: this.resX[index],
                xSVK: this.perfectX,
                ySVK: this.perfectY,
                zSVK: this.perfectZ
            });

            fixedC -= delta;

            // fixedC += this.rinexList[index].result.offset * this.lightSpeed;

            result.push(fixedC - this.__getFuncResult({
                X: this.X,
                xSVK: this.resX[index][0],
                ySVK: this.resX[index][1],
                zSVK: this.resX[index][2],
                deltaT: this.result.deltaT
            }));
            // }
        });

        return result;
    },

    __getFuncResult(parameters) {
        let deltaX = (parameters.xSVK - parameters.X[0]) ** 2;
        let deltaY = (parameters.ySVK - parameters.X[1]) ** 2;
        let deltaZ = (parameters.zSVK - parameters.X[2]) ** 2;
        let sum = deltaX + deltaY + deltaZ;

        const sqrt =  function sqrt(value){
            if(value < 2n){
                return value
            }
            
            function newtonIteration(n, x0) {
                const x1 = ((n /x0) + x0) >> 1n;
                if(x0 === x1 || x0 === (x1 - 1n)){
                    return x0;
                }

                return newtonIteration(n, x1)
            }

            return newtonIteration(value, 1n);
        };
        return math.sqrt(sum);
        // let result = math.sqrt(BigInt(math.floor(sum)));
        // return Number(result);

        // return sqrt;
    },

    __getDerivativeNumenator(parameters) {
        return parameters.coord - parameters.arg;
    },

    __checkEnd(r) {
        return (this.__getSum(r) < this.eps)
    },

    __getSum(r) {
        let result = 0;
        r.forEach((element, index) => {
            result += Math.pow(element, 2);
        });

        return result;
    },

    __setGenericKeys(){
      this.keys.forEach((key, index)=>{
         if(this.calcObs.keys.indexOf(key) !== -1){
             this.genericKeys.push(key)
         }
      });
    },

    getJson(fileName, secondFile, rinexData) {
        this.__parseFile(fileName);

        this.rinexList = this.__createList(rinexData);
        this.__prepareData();

        this.__createCalcObject(secondFile);

        // this.X = [this.calcObs.perfectX, this.calcObs.perfectY, this.calcObs.perfectZ, 0];

        this.__setGenericKeys();

        if(this.genericKeys.length < 4){
            return
        }

        let perfectCoords = [this.calcObs.perfectX, this.calcObs.perfectY, this.calcObs.perfectZ, 0];

        let r = this.__getR();
        let J = this.__getJ(r);

        while (true) {
            let currentDX = this.dX;
            this.dX = math.multiply(math.multiply(math.inv(math.multiply(math.transpose(J), J)), math.transpose(J)), r);
            this.X = math.subtract(this.X, this.dX);

            r = this.__getR();
            J = this.__getJ(r);
            // debugger;

            console.log(math.norm(this.dX));
            if (math.norm(math.abs(math.subtract(currentDX, this.dX))) < this.eps) {
                break;
            }
        }

        let resultMas = math.subtract(perfectCoords, this.X);

        return {
            x: this.X[0],
            y: this.X[1],
            z: this.X[2],
            dX: math.abs(resultMas[0]),
            dY: math.abs(resultMas[1]),
            dZ: math.abs(resultMas[2]),
            sputniks: this.keys
        }

    },
};