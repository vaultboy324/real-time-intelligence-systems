const fs = require('fs');

const config = require('../config/config');

module.exports = {
    deltaN: null,
    m0: null,
    e0: null,
    sqrtA: null,
    A: null,
    cIC: null,
    cRC: null,
    cIS: null,
    cRS: null,
    cUC: null,
    cUS: null,
    OMEGA0: null,
    omega: null,
    I0: null,
    OMEGADOT: null,
    IDOT: null,
    tOE: null,
    nGPS: null,
    tOC: null,
    tPC: null,
    num: null,

    m: 3.986005e+14,

    map: {},

    keys: [],

    EK: null,

    eps: 0.000000000001,

    omega3: 7.2921151467e-5,

    C: -4.44280763310e-10,

    __init() {
        this.tPC = new Date(2019, 8, 13, 0, 0, 0);
        this.map = {};
    },

    __toFloat(value) {
        return parseFloat(value.replace('D', 'e'));
    },

    __getValue(oParameters) {
        let index = oParameters.currentIndex;
        let sDataString = oParameters.dataString;

        let value = '';

        while (sDataString[index] !== ' ' && sDataString[index] !== '\n') {
            if(sDataString[index] === '-'){
                if(sDataString[index - 1] !== 'D' && value !== ''){
                    break;
                }
            } else if(sDataString[index] === '\n'){
                ++index;
            }
            value += sDataString[index];
            ++index;
        }

        while (sDataString[index] === ' ' || sDataString[index] === '\n'){
            if(sDataString[index] === '\0'){
                return;
            }
            ++index;
        }

        oParameters.currentIndex = index;

        return this.__toFloat(value);
    },

    __toJSDate(oParameters){
        if (oParameters.year >= 92){
            oParameters.year += 1900
        } else {
            oParameters.year += 2000
        }

        return new Date(oParameters.year, oParameters.month - 1, oParameters.day, oParameters.hour, oParameters.minute, oParameters.second);
    },


    __parseFile() {
        let contents = fs.readFileSync(`${config.files.rinex}`, 'utf8');
        let bodyStart = contents.indexOf('END OF HEADER') + 'END OF HEADER'.length + 1;

        let currentIndex = 0;
        let body = contents.substring(bodyStart);

        let oParameters = {
            currentIndex,
            dataString: body
        };

        while (oParameters.dataString.length !== oParameters.currentIndex) {

            let key = this.__getValue(oParameters);

            if (!this.map[key]) {
                this.map[key] = [];
            }

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
            let tOC = this.__toJSDate(oDateStruct);

            // let tPC = tOC;
            let tPC = this.tPC;
            // let tPC = new Date(2019, 8, 13, 0, 0, 0);

            let dayNum = 256;

            let af0 = this.__getValue(oParameters);
            af1 = this.__getValue(oParameters);
            af2 = this.__getValue(oParameters);

            let IODE = this.__getValue(oParameters);

            let cRS = this.__getValue(oParameters);

            let deltaN = this.__getValue(oParameters);

            let m0 = this.__getValue(oParameters);

            let cUC = this.__getValue(oParameters);

            let e0 = this.__getValue(oParameters);

            let cUS = this.__getValue(oParameters);

            let sqrtA = this.__getValue(oParameters);

            let tOE = this.__getValue(oParameters);

            let cIC = this.__getValue(oParameters);

            let OMEGA0 = this.__getValue(oParameters);

            let cIS = this.__getValue(oParameters);

            let I0 = this.__getValue(oParameters);

            let cRC = this.__getValue(oParameters);

            let omega = this.__getValue(oParameters);

            let OMEGADOT = this.__getValue(oParameters);

            let IDOT = this.__getValue(oParameters);

            let useless = this.__getValue(oParameters);

            let nGPS = this.__getValue(oParameters);

            useless = this.__getValue(oParameters);
            useless = this.__getValue(oParameters);
            let TGD = this.__getValue(oParameters);
            useless = this.__getValue(oParameters);
            useless = this.__getValue(oParameters);
            useless = this.__getValue(oParameters);
            useless = this.__getValue(oParameters);

            let node = {
                tOC,
                tPC,
                dayNum,
                cRS,
                deltaN,
                m0,
                cUC,
                e0,
                cUS,
                sqrtA,
                tOE,
                cIC,
                OMEGA0,
                cIS,
                I0,
                cRC,
                omega,
                OMEGADOT,
                IDOT,
                nGPS,
                af0,
                af1,
                af2,
                TGD
            };
            this.map[key].push(node);
        }

    },

    __calculate(){
       for (let key in this.map){
           this.map[key].forEach((element, index)=>{
               let dayNum = element.tOE / 86400;

               let t = dayNum * 86400 + element.tPC.getHours() * 3600 + element.tPC.getMinutes() * 60 + element.tPC.getSeconds();

               let tK = t - element.tOE;

               if(tK > 302400){
                   tK -= 604800;
               } else if(tK < -302400) {
                   tK += 604800;
               }

               let A = Math.pow(element.sqrtA, 2);

               let n = Math.sqrt(this.m/Math.pow(A, 3)) + element.deltaN;

               let MK = element.m0 + n * tK;

               let EK = this.__Newton(MK, element);
               let derivativeEK = n / (1 - element.e0 * Math.cos(EK));

               let trueAnomaly = Math.atan2(Math.sqrt(1 - Math.pow(element.e0, 2)) * Math.sin(EK) , (Math.cos(EK) - element.e0));

               let latArg = trueAnomaly + element.omega;
               let derivativeLatArg = (Math.sqrt(1 - Math.pow(element.e0, 2)) * derivativeEK) / (1 - element.e0 * Math.cos(EK));

               let deltaUK = element.cUC * Math.cos(2 * latArg) + element.cUS * Math.sin(2 * latArg);
               let UK = latArg + deltaUK;
               let derivativeUK = derivativeLatArg * (1 + 2 * (element.cUC * Math.cos(2 * latArg) + element.cUS * Math.sin(2 * latArg)));

               let deltaRK = element.cRC * Math.cos(2 * latArg) + element.cRS * Math.sin(2 * latArg);
               let RK = A * (1 - element.e0 * Math.cos(EK)) + deltaRK;
               let derivativeRK = A * element.e0 * derivativeEK * Math.sin(EK) + 2 * derivativeLatArg * (element.cRC * Math.cos(2 * latArg) + element.cRS * Math.sin(2 * latArg));

               let deltaIK = element.cIC * Math.cos(2 * latArg) + element.cIS * Math.sin(2 * latArg);
               let IK = element.I0 + deltaIK + element.IDOT * tK;
               let derivativeIK = element.IDOT + 2 * derivativeLatArg * (element.cIS * Math.cos(2 * latArg) + element.cIC * Math.sin(2 * latArg));

               let xPlane = RK * Math.cos(UK);
               let yPlane = RK * Math.sin(UK);

               let derivativeXPlane = derivativeRK * Math.cos(UK) - yPlane * derivativeUK;
               let derivativeYPlane = derivativeRK * Math.sin(UK) - xPlane * derivativeUK;

               let OMEGAK = element.OMEGA0 + (element.OMEGADOT - this.omega3) * tK - this.omega3 * element.tOE;
               let derivativeOMEGAK = element.OMEGADOT - this.omega3;

               let xSVK = xPlane * Math.cos(OMEGAK) - yPlane * Math.cos(IK) * Math.sin(OMEGAK);
               let ySVK = xPlane * Math.sin(OMEGAK) + yPlane * Math.cos(IK) * Math.cos(OMEGAK);
               let zSVK = yPlane * Math.sin(IK);

               let derivativeXSVK = -derivativeOMEGAK * ySVK + derivativeXPlane * Math.cos(OMEGAK) - (derivativeYPlane * Math.cos(IK) - yPlane * derivativeIK * Math.sin(IK)) * Math.sin(OMEGAK);
               let derivativeYSVK = derivativeOMEGAK * xSVK + derivativeXPlane * Math.sin(OMEGAK) + (derivativeYPlane * Math.cos(IK) - yPlane * derivativeIK * Math.sin(IK)) * Math.cos(OMEGAK);
               let derivativeZSVK = yPlane * derivativeIK * Math.sin(IK) + derivativeYPlane * Math.sin(IK);

               let deltaTR = this.C * element.e0 * element.sqrtA * Math.sin(EK);
               let offset = element.af0 + element.af1 * tK + element.af2 * (tK ** 2) - element.TGD + deltaTR;
               // let offset = element.af0 + element.af1 * tK + element.af2 * (tK ** 2) - element.TGD;

               result = {
                   xSVK,
                   ySVK,
                   zSVK,
                   derivativeXSVK,
                   derivativeYSVK,
                   derivativeZSVK,
                   dayNum,
                   offset,
                   t,
                   tOE: element.tOE,
                   omega3: this.omega3
               };

               this.map[key][index].result = result;

           })
       }
    },

    __Newton(MK, element){
      let EK = MK;

      let EKnew = EK + (MK - EK + element.e0*Math.sin(EK)) / (1 - element.e0 * Math.cos(EK));

      while(Math.abs(EKnew - EK) > this.eps){
          EK = EKnew;
          EKnew = EK + (MK - EK + element.e0 * Math.sin(EK)) / (1 - element.e0 * Math.cos(EK));
      }

      return EKnew;
    },

    getJson() {
        this.__init();
        this.__parseFile();
        this.__calculate();
        return this.map;
    }
};