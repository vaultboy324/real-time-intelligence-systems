const express = require('express');

const tableEditor = require('./module/table editor');
const observerParser = require('./module/observer_parseer');
const rinexParser = require('./module/rinex_parser');

const config = require('./config/config');

let app = express();

app.use(express.json({
    type: ['application/json', 'text/plain']
}));

app.use((req, res, next)=> {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
   next();
});

app.get("/", (req, res)=>{
   //  let structure = rinex_parser.getJson();
   //  let sp3 = sp3_parser.getJSON();
   // res.send(JSON.stringify(structure, null, "\t"));
    res.send(observerParser.getJson(config.files.observer, config.files.calcObserver, rinexParser.getJson()));
    // res.send(tableEditor.getTable());
});

const server = app.listen(process.env.PORT || '5000', ()=> {
    console.log(`App listen on port ${server.address().port}`);
    console.log('Press Ctrl+C to quit');
});