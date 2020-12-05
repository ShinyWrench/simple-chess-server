const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.get('/', (req, res) => {
    res.send('Hiya buddy!');
});

app.post('/', urlencodedParser, (req, res) => {
    res.send(`This is what you said: ${JSON.stringify(req.body)}`);
});

app.listen(port);
