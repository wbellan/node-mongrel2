var Sys, Zeromq, buildHttpResponse, parse, parseNetstring, split, statusMessages;
var __hasProp = Object.prototype.hasOwnProperty;
Zeromq = require('zeromq');
Sys = require('util');
statusMessages = {
  '100': 'Continue',
  '101': 'Switching Protocols',
  '200': 'OK',
  '201': 'Created',
  '202': 'Accepted',
  '203': 'Non-Authoritative Information',
  '204': 'No Content',
  '205': 'Reset Content',
  '206': 'Partial Content',
  '300': 'Multiple Choices',
  '301': 'Moved Permanently',
  '302': 'Found',
  '303': 'See Other',
  '304': 'Not Modified',
  '305': 'Use Proxy',
  '307': 'Temporary Redirect',
  '400': 'Bad Request',
  '401': 'Unauthorized',
  '402': 'Payment Required',
  '403': 'Forbidden',
  '404': 'Not Found',
  '405': 'Method Not Allowed',
  '406': 'Not Acceptable',
  '407': 'Proxy Authentication Required',
  '408': 'Request Timeout',
  '409': 'Conflict',
  '410': 'Gone',
  '411': 'Length Required',
  '412': 'Precondition Failed',
  '413': 'Request Entity Too Large',
  '414': 'Request-URI Too Large',
  '415': 'Unsupported Media Type',
  '416': 'Request Range Not Satisfiable',
  '417': 'Expectation Failed',
  '500': 'Internal Server Error',
  '501': 'Not Implemented',
  '502': 'Bad Gateway',
  '503': 'Service Unavailable',
  '504': 'Gateway Timeout',
  '505': 'HTTP Version Not Supported'
};
split = function(str, chr, limit) {
  var parts, ret;
  parts = str.split(chr);
  ret = parts.slice(0, limit - 1);
  ret.push(parts.slice(limit - 1).join(chr));
  return ret;
};
parseNetstring = function(ns) {
  var _ref, len, rest;
  _ref = split(ns, ':', 2);
  len = _ref[0];
  rest = _ref[1];
  len = parseInt(len);
  if (rest[len] !== ',') {
    throw "Netstring did not end in ','";
  }
  return [rest.slice(0, len), rest.slice(len + 1)];
};
parse = function(msg) {
  var _ref, body, connId, headers, path, rest, uuid;
  _ref = split(msg, ' ', 4);
  uuid = _ref[0];
  connId = _ref[1];
  path = _ref[2];
  rest = _ref[3];
  _ref = parseNetstring(rest);
  headers = _ref[0];
  rest = _ref[1];
  body = parseNetstring(rest)[0];
  return {
    headers: JSON.parse(headers),
    body: body,
    uuid: uuid,
    connId: connId,
    path: path
  };
};
buildHttpResponse = function(status, headers, body) {
  var _ref, h, header, value;
  headers['Content-Length'] = body.length;
  h = [];
  _ref = headers;
  for (header in _ref) {
    if (!__hasProp.call(_ref, header)) continue;
    value = _ref[header];
    h.push("" + (header) + ": " + (headers[header]));
  }
  return "HTTP/1.1 " + (status) + " " + (statusMessages[status]) + "\r\n" + (h.join("\r\n")) + "\r\n\r\n" + (body);
};
exports.connect = function(recv_spec, send_spec, ident, callback) {
  var pub, pull;
  pull = Zeromq.createSocket('pull');
  pull.connect(recv_spec);
  pull.identity = ident;
  pub = Zeromq.createSocket('pub');
  pub.connect(send_spec);
  pub.identity = ident;
  return pull.on('message', function(envelope, blank, data) {
    var msg;
    msg = parse(envelope.toString('utf8'));
    return callback(msg, function(status, headers, body) {
      return pub.send("" + (msg.uuid) + " " + (String(msg.connId).length) + ":" + (msg.connId) + ", " + (buildHttpResponse(status, headers, body)));
    });
  });
};