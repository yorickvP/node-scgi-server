/*jshint asi:true laxbreak:true */
/* requires node-protoparse (npm install protoparse).
 * or just install this using npm install scgi-server */
var    net = require('net')
  , Parser = require('protoparse')
 , EventEmitter = require('events').EventEmitter
module.exports = SCGIServer

function SCGIServer(server, no_buffer) {
    if ('number' == typeof server) {
        var port = server
        server = net.createServer()
        server.listen(port)
    }
    var self = this
    EventEmitter.call(this)
    server.on('connection', function connectionHandler(socket) {
        var headers = {}
          , p = Parser.Stream(socket)
            .scan('len', ':')
            .tap(function(vars) {
                if (isNaN(+vars.len)) {
                    socket.end()
                    this.stop()
                    self.emit('request', 'invalid header length in SCGI request', socket)
                    return            }
                var len = +vars.len
                if (len == 0)         {
                    socket.end()
                    this.stop()
                    self.emit('request', 'no headers specified in SCGI request', socket)
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
                    socket.end()
                    this.stop()
                    self.emit('request', 'invalid content length header', socket, headers)
                    return
                }
                vars.content_length = l
            })
        if (!no_buffer) p.buffer('data', 'content_length')
           p.tap(function(vars) {
                self.emit('request', null, socket, function header(n, encoding) {
                    if (!n) {
                        var r = {} // format the headers as lower case http headers
                        Object.keys(headers)
                              .filter(function(i) {return i.indexOf('HTTP_') === 0})
                              .forEach(function(k) {r[k.toLowerCase()
                                                       .split('_')
                                                       .slice(1)
                                                       .join('-')] = header(k)})
                        return r }
                    return (headers[n] ? (encoding == 'buffer' ? headers[n] :
                            headers[n].toString(encoding || 'ascii')) : undefined) }, no_buffer ? p._buffer : vars.data)
            })
    })
    return self
}

SCGIServer.prototype = new EventEmitter()

