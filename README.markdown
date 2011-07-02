SCGI-Server
===========

[Simple Common Gateway Interface](http://en.wikipedia.org/wiki/Simple_Common_Gateway_Interface) server for [node.js](http://nodejs.org/).

This is basically a rewritten and updated version of [orlandov's node-scgi](http://github.com/orlandov/node-scgi).

Example
=======

    var SCGIServer = require('scgi-server');
    
    var server = SCGIServer(8085);
    server.on('request', function(error, socket, headers, data) {
        if (error) {
            console.error("received invalid scgi request");
            return;
        }
        socket.write("Status: 200 OK\r\nContent-Type: text/html; charset=utf-8\r\n\r\n");
        socket.write("<h1>Hello, World!</h1>");
        socket.end();
    });

Alternatively, you can pass an existing TCP server to SCGIServer.

Emitted events
==============

"request" (error, socket, headers, data)
----------------------------------------
Is emitted when a complete request is received. You can write your data to socket, be sure to send headers first.
The POST data (if there was any) is sent with "data".
Headers is a function that you can call like headers("name", "encoding"), with encoding being any of the standard node encodings, or "buffer" if you want to get the raw buffer. If not given, it defaults to "ascii".


