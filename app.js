const controller = require('./controller');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({extended: false});

app.get('/', (req, res) => {
    res.send("Hiya buddy!");
});

app.post('/', urlencodedParser, (req, res) => {
    console.log(`${JSON.stringify(req.body)}`);
    setTimeout(() => {
        res.send(`This is what you said: ${JSON.stringify(req.body)}`);
    }, 1500);
});

app.post('/add', jsonParser, controller.addNumbers);

app.listen(port);