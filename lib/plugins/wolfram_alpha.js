/*!
* Nullstar
* Copyright(c) 2014 Nicholas Penree <nick@penree.com>
* MIT Licensed
*/

/**
 * Module dependencies.
 */

var request = require('request');
var Plugin = require('../plugin');
var inherits = require('util').inherits;
var format = require('util').format;
var debug = require('debug')('nullstar:plugin:wolfram_alpha');
var timeago = require('timeago');
var ent = require('ent');
var alpha = require('wolfram-alpha');

/**
 * Creates an instance of a `WolframAlphaPlugin`.
 *
 * @constructor
 * @this {WolframAlphaPlugin}
 * @param {Bot} bot
 * @api public
 */

function WolframAlphaPlugin(bot) {
  Plugin.call(this, bot);
  this.wolfram = alpha.createClient(this.get('wolfram alpha app id'));
}

/**
 * Inherit from `Plugin`.
 */

inherits(WolframAlphaPlugin, Plugin);

/**
 * The plugin name.
 */

WolframAlphaPlugin.prototype.name = 'WolframAlpha Plugin';

/**
 * The plugin version.
 */

WolframAlphaPlugin.prototype.version = '0.1';

WolframAlphaPlugin.prototype.$alpha = function(id, nick, channel, query) {
  if (id === 'irc' && channel === '#voidptr') return;
  this.wolfram.query(query, function(err, results) {
    if (err) throw err;
    results = results || [];

    var primary;
    var interpret;
    var text;
    var searchResults = [];

    results.forEach(function(result) {
      // find interpretation
      if (result.title === 'Input interpretation') {
        (result.subpods || []).every(function(pod) {
          interpret = (pod || {}).text;
          if (interpret) {
            debug('found text iterpretation: %s', JSON.stringify(text));
            this.bot.notice(id, channel, format('Interpretation: %s', interpret));
            return false;
          }
          return true;
        }, this);
      }
      // find primary
      if (result.primary === true) {
        primary = result;
        debug('found primary result: %s', JSON.stringify(primary));
        return false;
      }
      // add results
      if (result.title === 'Result') {
        searchResults.push(result);
      }
      return true;
    }, this);

    if (primary) {
      (primary.subpods || []).every(function(pod) {
        text = (pod || {}).text;
        if (text) {
          debug('found primary text result: %s', JSON.stringify(text));
        }
        return typeof text === undefined;
      }, this);
    }
    if (!text && searchResults.length) {
      searchResults.every(function(pod) {
        (pod.subpods || []).every(function(sub) {
          text = (sub || {}).text;
          if (text) {
            debug('found text result: %s', JSON.stringify(text));
          }
          return typeof text === undefined;
        }, this);
        return typeof text === undefined;
      }, this);
    }

    if (text) {
      this.bot.notice(id, channel, format('Result: %s', text));
    } else {
      this.bot.notice(id, channel, format('No results found for: %s', query));
    }
  }.bind(this));
};

/**
 * Expose `WolframAlphaPlugin`.
 */

module.exports = WolframAlphaPlugin;
