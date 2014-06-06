// __Dependencies__
var events = require('baucis-events');
var request = require('request');

var Hook = new mongoose.Schema({
  _id: { type: String, required: true }, // TODO random guid
  url: { type: String, required: true },// TODO add validation
  tags: [ { type: String, enum: [ 'created', 'updated', 'deleted' ] } ], // TODO  required >= 1, set
  ids: [ ObjectId ] // TODO required >= 1, set
});

// __Module Definition__
var plugin = module.exports = function () {
  var baucis = this;

  function subscribe (tag) {
    return channel.subscribe(tag, function (e) {
      // Look up hooks in the Mongo collection that want to know about this event.
      // Execute each hook asynchronously.
      var query = mongoose.model('hook');
      query.where('tag').eq(tag);
      query.where('ids').eq(e.doc._id);
      query.stream().pipe(es.map(function (hook) {
        request.post(hook.url).body(e);
      });
    });
  }

  // Have the controller emit events.
  baucis.Api.decorators(function (options, protect) {
    var channel = baucis.channel();
    subscribe('created');
    subscribe('updated');
    subscribe('deleted');
    // Create the controller for adding hooks.
    api.hooks = api.rest('hook').methods('head get put delete', false);
  });
}
