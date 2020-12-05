const http = require('http');

let postData = JSON.stringify({ a: 5000, b: 900 });

http.request(
    {
        hostname: 'localhost',
        port: 3000,
        path: '/add',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length,
        },
    },
    (res) => {
        console.log(`statusCode = ${res.statusCode}`);
        res.on('data', (d) => {
            console.log(`response data: ${d}`);
        });
    }
)
    .on('error', (err) => {
        console.log(`Error: ${err}`);
    })
    .write(postData);
