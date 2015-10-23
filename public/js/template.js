/* global LiveReload, myPath */

LiveReload.connector.handlers._message = LiveReload.connector.handlers.message;

LiveReload.connector.handlers.message = function(message) { 
  if (message.path.indexOf(myPath) === -1) {
    return;
  }
  return LiveReload.connector.handlers._message.apply(this, arguments);
};