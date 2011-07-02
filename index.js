/* requires substack/node-binary and dependencies (npm install binary) */
var    net = require('net')
  , Binary = require('binary')

module.exports = SCGIServer

function SCGIServer(server) {
    if ('number' == typeof server) {
        var port = server
        server = net.createServer()
        server.listen(port)
    }
    server.on('connection', function connectionHandler(socket) {
        var headers = {}
        Binary.stream(socket)
            .scan('len', ':')
            .tap(function(vars) {
                if (isNaN(+vars.len)) {
                    socket.end() // get it to stop parsing?
                    server.emit('request', 'invalid header length in SCGI request', socket)
                    return            }
                var len = +vars.len
                if (len == 0)         {
                    socket.end() // get it to stop parsing?
                    server.emit('request', 'no headers specified in SCGI request', socket)
                    return            }
                this.loop(function(end, vars) {
                    this.scan('key', new Buffer([0]))
                        .scan('value', new Buffer([0]))
                        .tap(function (vars) {
                            headers[vars.key.toString()] = vars.value
                            len -= vars.key.length + vars.value.length + 2
                            if (len == 0) end()
                        })
                })
            })
            .skip(1) // skip the ,
            .tap(function(vars) {
                var l = 0
                if (headers['CONTENT_LENGTH']) l = +headers['CONTENT_LENGTH'].toString('ascii')
                if (isNaN(l)) {
                    socket.end() // get it to stop parsing?
                    server.emit('request', 'invalid content length header', socket, headers)
                    return
                }
                vars.content_length = l
            })
            .buffer('data', 'content_length')
            .tap(function(vars) {
                server.emit('request', null, socket, function header(n, encoding) {
                    return (headers[n] ? (encoding == 'buffer' ? headers[n] :
                            headers[n].toString(encoding || 'ascii')) : undefined) }, vars.data)
            })
    })
    return server
}



