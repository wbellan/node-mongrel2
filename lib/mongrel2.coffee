Zeromq = require('zeromq')
Sys = require('sys')

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
}

split = (str, chr, limit) ->
  parts = str.split(chr)
  ret = parts.slice(0, limit - 1)
  ret.push(parts.slice(limit - 1).join(chr))
  ret

parseNetstring = (ns) ->
  # SIZE:HEADERS,
  [len, rest] = split(ns, ':', 2)
  len = parseInt(len)
  throw "Netstring did not end in ','" unless rest[len] == ','
  [rest.slice(0, len), rest.slice(len + 1)]

parse = (msg) ->
  [uuid, connId, path, rest] = split(msg, ' ', 4)
  [headers, rest] = parseNetstring(rest)
  body = parseNetstring(rest)[0]
  {
    headers: JSON.parse(headers),
    body: body,
    uuid: uuid,
    connId: connId,
    path: path
  }

buildHttpResponse = (status, headers, body) ->
  headers['Content-Length'] = body.length
  h = []
  for header, value of headers
    h.push("#{header}: #{headers[header]}")
  "HTTP/1.1 #{status} #{statusMessages[status]}\r\n#{h.join("\r\n")}\r\n\r\n#{body}"

exports.connect = (recv_spec, send_spec, ident, callback) ->
  pull = Zeromq.createSocket('pull')
  pull.connect(recv_spec)
  pull.identity = ident

  pub = Zeromq.createSocket('pub')
  pub.connect(send_spec)
  pub.identity = ident

  pull.on 'message', (envelope, blank, data) ->
    msg = parse(envelope.toString('utf8'))
    callback msg, (status, headers, body) ->
      pub.send("#{msg.uuid} #{String(msg.connId).length}:#{msg.connId}, #{buildHttpResponse(status, headers, body)}")