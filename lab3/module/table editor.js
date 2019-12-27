const rinex_parser = require('./rinex_parser');
const sp3_parser = require('./sp3_parser');


module.exports = {
    getTable() {
        let table = [];

        let rinexData = rinex_parser.getJson();
        let sp3Data = sp3_parser.getJSON();

        for(let key in rinexData) {
            let currentRinexList = rinexData[key];
            let currentSP3List = sp3Data[key];

            if (typeof currentSP3List === 'undefined') {
                continue;
            }

            currentRinexList.forEach((rinexElement, rinexIndex) => {
                currentSP3List.forEach((sp3Element, sp3Index) => {
                    if (this.__compareDates(sp3Element.tOC, rinexElement.tOC)) {
                        let node = {
                            year: rinexElement.tOC.getFullYear(),
                            month: rinexElement.tOC.getMonth() + 1,
                            day: rinexElement.tOC.getDate(),
                            hour: rinexElement.tOC.getHours(),
                            minute: rinexElement.tOC.getMinutes(),
                            second: rinexElement.tOC.getSeconds(),
                            xSVK: Math.abs(rinexElement.result.xSVK - sp3Element.result.xSVK),
                            ySVK: Math.abs(rinexElement.result.ySVK - sp3Element.result.ySVK),
                            zSVK: Math.abs(rinexElement.result.zSVK - sp3Element.result.zSVK),
                            sputnik: key
                        };
                        table.push(node);
                        return;
                    }
                });
            });
        }


        return table;
    },

    __compareDates(sp3Date, rinexDate){
        return sp3Date.getFullYear() === rinexDate.getFullYear() &&
            sp3Date.getMonth() === rinexDate.getMonth() &&
            sp3Date.getDate() === rinexDate.getDate() &&
            sp3Date.getHours() === rinexDate.getHours() &&
            sp3Date.getMinutes() === rinexDate.getMinutes() &&
            sp3Date.getSeconds() === rinexDate.getSeconds();
    }
}