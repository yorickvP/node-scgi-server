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

The POST data (if there was any) is sent as array of buffers with "data", and the following postdata will be sent over the socket.
To stop new data going into the array, you can call socket.removeAllListeners('data'). See HTTPapi.js around line 36.

Headers is a function that you can call like headers("name", "encoding"), with encoding being any of the standard node encodings, or "buffer" if you want to get the raw buffer. If not given, it defaults to "ascii".
You can also call headers without arguments, to give you all of the HTTP headers as an object formatted like-so in lower-case.


Changes from v0.0.2
===================

 - Instead of emitting a 'request' event on the socket, new SCGIServer will now give you an own EventEmitter.
 
 - Calling headers without arguments will give you an object like {accept: "text/plain", status: '200 OK'}.

 - Remove reading of the entire POST data into a Buffer, because the data can be huge, and this can be used as an attack.

 - API that tries to be just like [the node v0.5/0.6 http api](http://nodejs.org/docs/v0.5.6/api/http.html).


HTTP Emulating API
==================

In v0.1.0, I added an API that (loosely) follows the node.js http API. Some features (like trailers or stream pausing/resuming) are missing though.

Why?
----

 - Quickly change your module from http to scgi: sed s/http/scgi/ and require('http') -> require('scgi-server/httpapi.js')

 - Use it with [connect v2](https://github.com/senchalabs/connect) (not yet released at time of writing):

        var scgi = require('scgi-server/httpapi.js')
          , connect = require('connect')
        
          , handler = connect().use(connect.logger())
                               .use(connect.favicon())
                               .use(connect.static())
                               .use(connect.directory());
        var server = scgi.createServer(handler);
        server.listen(8085);

