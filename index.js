// wska.js
/*jshint esversion: 6 */

/**
 * WebSocketKeepAlive is a client layer on top of ws WebSocket which uses the ping/pong
 * frames defined in RFC 6455 (https://tools.ietf.org/html/rfc6455) and implemented
 * in the ws WebSocket module to keep connections to a server alive. If a connection
 * fails then a new connection is established.
 */

var WebSocket = require('ws');
var EventEmitter = require('events').EventEmitter;
var Util = require('util');

var HEARTBEAT_INTERVAL = 30000;
var HEARTBEAT_TIMEOUT = 30000;
var RECONNECT_INTERVAL = 1000;
var PING_MESSAGE = 'wska';

function WebSocketKeepAlive(address, protocols, options, overrides) {
  var self, heartbeatTimeout;
  self = this;
  overrides = overrides || {};
  self.settings = {
    HEARTBEAT_INTERVAL: overrides.heartbeatInterval || HEARTBEAT_INTERVAL,
    HEARTBEAT_TIMEOUT: overrides.heartbeatTimeout || HEARTBEAT_TIMEOUT,
    RECONNECT_INTERVAL: overrides.reconnectInterval || RECONNECT_INTERVAL,
    PING_MESSAGE: overrides.pingMesage || PING_MESSAGE,
    RECONNECT: (typeof(overrides.reconnect) === 'undefined' ? true : overrides.reconnect)
  };
  self.ws = null;

  // call parent constructor
  EventEmitter.call(self);

  // first connection attempt
  createWebSocket(address, protocols, options);

  // create a websocket
  function createWebSocket(address, protocols, options) {
    try {
      self.ws = new WebSocket(address, protocols, options);
    }
    catch (e) {
      self.emit('error', new Error(e.toString()));
      self.ws = null;
      reconnectSocket();
    }
    if (self.ws) {
      configureWebSocket();
    }
  }

  // attempt reconnect
  function reconnectSocket() {
    if (self.settings.RECONNECT) {
      setTimeout(function () {
        createWebSocket(address, protocols, options);
      }, self.settings.RECONNECT_INTERVAL);
    }
  }

  // configure the websocket for subscription
  function configureWebSocket() {
    self.ws
    .on('open', function () {
      self.emit('open', self.ws);
      heartbeatStart();
    })
    .on('message', function () {
      heartbeatStart(); // message will keep alive, restart heartbeat
    })
    .on('error', function (err) {
      self.emit('error', new Error(err.toString()));
    })
    .on('close', function () {
      reconnectSocket();
    })
    .on('pong', function (msg) {
      heartbeatStart();
    });
  }

  // start the heartbeat interval
  function heartbeatStart() {
    heartbeatEnd(); // reset any waiting heartbeat
    heartbeatTimeout = setTimeout(function () {
      heartbeat();
    }, self.settings.HEARTBEAT_INTERVAL);
  }

  // end any currently waiting heartbeat
  function heartbeatEnd() {
    clearTimeout(heartbeatTimeout);
  }

  // send a heartbeat ping
  function heartbeat() {
    try {
      self.ws.ping(self.settings.PING_MESSAGE);
      heartbeatTimeout = setTimeout(function () {
        heartbeatFail();
      }, self.settings.HEARTBEAT_TIMEOUT);
    }
    catch (e) {
      heartbeatFail();
    }
  }

  // process heartbeat failure
  function heartbeatFail() {
    try {
      self.emit('warning', 'Heartbeat failure.');
      self.ws.close();
    }
    catch (e) {}
  }
}


WebSocketKeepAlive.prototype.getWebSocket = function () {
  return this.ws;
};

WebSocketKeepAlive.prototype.setReconnect = function (reconnect) {
  this.settings.RECONNECT = reconnect;
};

WebSocketKeepAlive.prototype.killWebSocket = function () {
  this.setReconnect(false);
  if (this.ws) {
    this.ws.close();
  }
};


Util.inherits(WebSocketKeepAlive, EventEmitter);
module.exports = WebSocketKeepAlive;
