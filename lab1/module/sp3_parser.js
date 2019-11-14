const fs = require('fs');

const config = require('../config/config')

module.exports = {
    map: {},

    __parseFile(){
        let contents = fs.readFileSync(`${config.files.sp3}`, 'utf8');
        let bodyStart = contents.indexOf('CLK:CMB') + 'CLK:CMB'.length + 1;

        let currentIndex = 0;
        let body = contents.substring(bodyStart);

        let oParameters = {
            currentIndex,
            dataString: body
        };

        while (oParameters.dataString.length !== oParameters.currentIndex) {
            let useless = this.__getValue(oParameters);
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

            oParameters.tOC = this.__toJSDate(oDateStruct);
            while (oParameters.dataString[oParameters.currentIndex] !== '*'){
                this.__parseString(oParameters);
                if(oParameters.dataString.length === oParameters.currentIndex){
                    break;
                }
            }
        }
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

        if(value.includes('PG')){
            return this.__toFloat(value.split('PG')[1]);
        }

        return this.__toFloat(value);
    },

    __toFloat(value) {
        return parseFloat(value.replace('D', 'e'));
    },

    __toJSDate(oParameters){
        // if (oParameters.year >= 92){
        //     oParameters.year += 1900
        // } else {
        //     oParameters.year += 2000
        // }

        return new Date(oParameters.year, oParameters.month - 1, oParameters.day, oParameters.hour, oParameters.minute, oParameters.second);
    },

    __parseString(oParameters){
        let key = this.__getValue(oParameters);
        // this.__getValue(oParameters);

        let xSVK = this.__getValue(oParameters) * 1000;
        let ySVK = this.__getValue(oParameters) * 1000;
        let zSVK = this.__getValue(oParameters) * 1000;

        if(!this.map[key]){
            this.map[key] = []
        }

        let node = {
            result: {
                xSVK,
                ySVK,
                zSVK
            },
            tOC: oParameters.tOC
        };

        this.map[key].push(node);

        while (oParameters.dataString[oParameters.currentIndex + 1] !== 'G' && oParameters.dataString[oParameters.currentIndex] !== '*'){
            if(oParameters.dataString[oParameters.currentIndex + 1] === 'E'){
                oParameters.currentIndex += 'EOF'.length + 2;
                return;
            }
            ++oParameters.currentIndex;
        }

        // useless = this.__getValue(oParameters);
        // useless = this.__getValue(oParameters);
        // useless = this.__getValue(oParameters);
        // useless = this.__getValue(oParameters);
        // useless = this.__getValue(oParameters);
    },
    getJSON() {
        // let sp3 = sp3_parser.__parseFile();
        this.__parseFile();
        return this.map
    }
};