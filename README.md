# wska

## Class: WebSocketKeepAlive

The WebSocketKeepAlive class is used as a client layer on top of the [ws WebSocket class](https://github.com/websockets/ws) to maintain a client connection to a server. The keep alive relies on the ping/pong frames defined in [RFC6455](https://tools.ietf.org/html/rfc6455) and implemented in the ws WebSocket and ws WebSocket.Server classes.

The class extends the EventEmitter class to provide events that will inform the client application off keep alive events such as the 'open' of a new client socket.


### new WebSocketKeepAlive(address[, protocols][, options][, settings])

Arguments passed to the constructor of the WebSocketKeepAlive class are the same as the ws WebSocket class with one additional 'settings' argument as optional settings for the WebSocketKeepAlive class. Note that the optional settings argument must be prefixed with the optional WebSocket arguments even if they are null. I.E.

```javascript
var wska = new WebSocketKeepAlive('ws://localhost:8080', null, null, { pingMessage: 'myApp' });
```

#### settings
- `heartbeatInterval` {Number} The number of milliseconds between each heartbeat transmission.
- `heartbeatTimeout` {Number} The number of milliseconds before a heartbeat will timeout and fail.
- `reconnectInterval` {Number} The number of milliseconds of delay before a reconnection attempt will be made.
- `pingMesage` {String} A message that will be included with the ping frame sent for a heartbeat.


### Events

WebSocketKeepAlive uses events to communicate with the client application. It is important to make a distinction between events that are related to the WebSocketKeepAlive instance and the events related to the WebSocket instance that is making the connection to the server.


#### Event: 'open'

- `ws` {WebSocket} Passes the WebSocket instance when the connection opens successfully.

The 'open' event from the WebSocketKeepAlive instance is related to the 'open' event from the WebSocket instance. When a successful connection to the server is established the WebSocketKeepAlive instance will use the 'open' event to inform the client application and provide the underlying WebSocket instance that has made the connection.

Note that an 'open' event will occur each time there is a connection. If the current connection fails and WebSocketKeepAlive creates a new connection then a new 'open' event will be generated and will provide a new WebSocket instance.

```javascript
// create the keep alive instance that connects to a local server
var wska = new WebSocketKeepAlive('ws://localhost:8080');

// watch for a successful connection to the server
wska.on('open', function (ws) {
  /**
   * Note how the event handlers in here are for the WebSocket connected to the server.
   * While the events outside this scope are event handlers for the keep alive instance.
   */
  // watch for messages on the new WebSocket connection
  ws.on('message', function (msg) {
    console.log('NEW MSG ', msg.toString());
  });

  // watch for a close of the new WebSocket connection
  ws.on('close', function () {
    console.log('CONNECTION CLOSED, keep alive should create a new one momentarily.');
  });
});

// watch for errors in keep alive
wska.on('error', function (err) {
  console.log('KEEP ALIVE ERROR ', err.toString());
});
```


#### Event: 'error'

- `error` {Object} The error object.

Errors emitted by the keep alive instance may be related to the keep alive process or they may be related to the current WebSocket instance.


#### Event: 'warning'

- `warning` {Object} An error type object that is at a warning level.

The keep alive instance will intercept some connection errors and attempt to re-establish the connection. These will be emitted as warnings as the keep alive process will try to recover.


### Methods

After a WebSocketKeepAlive instance is created it will include a few methods for control of the connection state.


#### WebSocketKeepAlive.getWebSocket()

While the 'open' event will provide an instance of the current WebSocket that is connected to the server it is also possible to request the WebSocket instance from the keep alive process. Note that this will be the currently active WebSocket instance but may become invalid if the WebSocketKeepAlive instance needs to create a new WebScoket to re-establish a broken connection. The 'open' event is the preferred method of acquiring the currently valid WebSocket.


#### WebSocketKeepAlive.setReconnect(reconnect)

- `reconnect` {Boolean} The reconnection state to use in the WebSocketKeepAlive instance.

The default state of a WebSocketKeepAlive instance is to attempt reconnections if a server connection fails. This state can be changed with the setReconnect() method.


#### WebSocketKeepAlive.prototype.KillWebSocket()

A currently active WebSocket and the reconnection process can be terminated by calling the killWebSocket() method. This method will disable the reconnect state and close the currently open WebSocket.
