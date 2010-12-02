# node-mongrel2

A Mongrel2 handler for nodejs.

## Howto

This isn't an intro to Mongrel2. Try the [Mongrel2 Manual](http://mongrel2.org/doc/tip/docs/manual/book.wiki) for that.

Install with npm:

    % npm install mongrel2

Use it in your code:

    var mongrel2 = require('mongrel2');

    mongrel2.connect('tcp://127.0.0.1:9997', 'tcp://127.0.0.1:9996', 'test', function(msg, reply) {
      // do some logic
      reply(200, { 'Content-Type': 'text/plain' }, "Hello, World!\n" + JSON.stringify(msg));
    });

## Copyright

Copyright (c) 2010 Daniel Huckstep. See LICENSE for details.
