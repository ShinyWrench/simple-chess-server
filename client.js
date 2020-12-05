const http = require('http');

function addNumbers(a, b) {
    let postData = JSON.stringify({ a: a, b: b });

    return new Promise((resolve, reject) => {
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
                // console.log(`statusCode = ${res.statusCode}`);
                res.on('data', (d) => {
                    resolve(parseInt(d));
                });
            }
        )
            .on('error', (err) => {
                reject(err);
            })
            .write(postData);
    });
}

// TODO: change to async/await
// TODO: try to loop async/await in a Fibonacci-generating function
addNumbers(1, 2)
    .then((sum) => {
        console.log(`sum = ${sum}`);
        return addNumbers(sum, 3);
    })
    .then((sum) => {
        console.log(`sum = ${sum}`);
        return addNumbers(sum, 4);
    })
    .then((sum) => {
        console.log(`total = ${sum}`);
    })
    .catch((err) => {
        console.log(`Error adding numbers: ${err}`);
    });
