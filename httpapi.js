/*jshint asi:true laxbreak:true */
var SCGIServer = require('./index.js')
         , net = require('net')
        , http = require('http')
        , util = require('util')
, EventEmitter = require('events').EventEmitter
exports.Server = function Server() {
    net.Server.call(this)
    EventEmitter.call(this)
    this._scgi = new SCGIServer(this)
    var self = this
    this._scgi.on('request', function(error, socket, headers, data) {
        if(error) return self.emit('clientError', error)
        var req = new exports.ServerRequest(socket, headers, data)
        var res = new exports.ServerResponse(req)
        self.emit('request', req, res) })}

util.inherits(exports.Server, net.Server)

exports.ServerRequest = function ServerRequest(socket, headers, data) {
    EventEmitter.apply(this)
    this.method = headers('REQUEST_METHOD')
    this.url = headers('REQUEST_URI')
    socket.on('close', this.emit.bind(this, 'close'))
    this.connection = socket
    this.connection.remoteAddress = headers('REMOTE_ADDR')
    this.httpVersion = '1.0'
    this.httpVersionMajor = 1
    this.httpVersionMinor = 0
    var encoding = null
            , self = this
    this.setEncoding = function(e) { encoding = e }
    process.nextTick(function() {
        self.emit('data', data.toString(encoding))
        self.emit('end') })}

exports.ServerRequest.prototype = new EventEmitter()
exports.ServerRequest.pause = function() { throw "pausing not implemented" }
exports.ServerRequest.resume = function() { throw "pausing not implemented" }

exports.ServerResponse = function ServerResponse(req) {
    EventEmitter.call(this)
    this.connection = req.connection
    var self = this
    ;['drain', 'error', 'close', 'pipe'].forEach(function(i) {
        self.connection.on(i, self.emit.bind(self, i)) })
    this.__defineGetter__('writable', function() { return self.connection.writable })
    this.destroy = this.connection.destroy.bind(this.connection)
    this.destroySoon = this.connection.destroySoon.bind(this.connection)
    this._head_written = false
    this._headers = {}
    this.statusCode = 200 }

util.inherits(exports.ServerResponse, EventEmitter)
var CRLF = '\r\n'
;(function(i, k) { for(var j in k) i[j] = k[j]})(exports.ServerResponse.prototype,
  { write: function write() {
    if (!this._head_written) this.writeHead()
    // todo: requests without body
    this.connection.write.apply(this.connection, arguments) }

  , end: function end() {
    if (arguments.length) this.write.apply(this, arguments)
    if (!this._head_written) this.writeHead()
    this.connection.end() }
    
  , addTrailers: function addTrailers() {
      throw "trailers not implemented" }
      
  , writeHead: function writeHead(statuscode, reason, headers) {
    if (arguments.length == 2) { 
        headers = reason
        reason = "" }
    if (statuscode) this.statusCode = statuscode
    if (!reason) reason = http.STATUS_CODES[this.statusCode] || 'unknown'
    var hdr = this._headers
    if (headers) Object.keys(headers).forEach(function(x) {hdr[x] = headers[x]})
    var headtxt = ""
    headtxt += 'Status: ' + statuscode + ' ' + reason + CRLF
    Object.keys(hdr).forEach(function(k) {
        if (typeof hdr[k] == 'string')
            headtxt += k + ': ' + hdr[k] + CRLF
        else hdr[k].forEach(function(j) {
            headtxt += k + ': ' + j + CRLF })})
    this.connection.write(headtxt + CRLF)
    this._head_written = true }})

exports.createServer = function createServer(callback) {
    var s = new exports.Server()
    s.on('request', callback)
    return s }
