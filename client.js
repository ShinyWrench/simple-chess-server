const http = require('http');
const querystring = require('querystring');

let postData = querystring.stringify({ message: 'Hiya buddy!' });

http.request(
    {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length,
        },
    },
    (res) => {
        // console.log(`statusCode = ${res.statusCode}`);
        res.on('data', (d) => {
            console.log(`Response: ${d}`);
        });
    }
)
    .on('error', (err) => {
        console.log('Error with http request');
        console.log(`${err}`);
    })
    .write(postData);
