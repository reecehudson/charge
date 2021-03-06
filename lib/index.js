"use strict";

var debug = require("debug")("ch-arge:lib/index.js");
var inherits = require("util").inherits;

require("./bootstrap.js");
var types = require("./types.js");
var newType = require("./bootstrap.js").newType;

inherits(ArgError, Error);
// ArgError definition
function ArgError (message) {
  if (!(this instanceof ArgError)) return ArgError.apply(this, arguments);
  // NOTE Error is a factory function, will return a new object regardless, so
  // Error.apply(this, arguments) will not work
  var e = /*new*/ Error(message);
  // NOTE must use Object.getOwnPropertyNames() bc .stack and .message are
  // non-enumerable
  Object.getOwnPropertyNames(e).forEach(function (key) {
    this[key] = e[key];
  }, this);
  this.name = "ArgError";
}

/**
  * @api public
  * @param {Mixed} arg
  * @param {Function|String} arg1...[argn]
  * @param {Object} [opts]
  * @return {Boolean} ret
  */
module.exports = function (arg) {
  if ("0" in arguments === false) throw new TypeError("Requires an actual")
  // NOTE we are using `arguments` in strict mode, so none of that magic occurs
  lastArg = arguments[arguments.length -1];
  lastArgObj = typeof lastArg === "object" && lastArg !== null;
  if (lastArgObj && arguments.length === 2 || arguments.length === 1)
    throw new TypeError("No type seen");
  if (!lastArgObj) opts = {};
  else opts = lastArg;
  _arguments = lastArgObj ?
              [].slice.call(arguments, 0, arguments.length -1) :
              [].slice.call(arguments, 0, arguments.length);

  var checkQueue = [], already = [], alreadyC = [];
  var fn, reRes, res, lastArg, lastArgObj, shouldThrow, singleCheck,
      iterFn, exp, _arguments, opts, message;

  shouldThrow = ("shouldThrow" in opts) ? !!opts.shouldThrow : true;
  singleCheck = ("singleCheck" in opts) ? !!opts.singleCheck : true;
  message = ("message" in opts ?
              opts.message :
              "Wrong type: " + require("util").inspect(arg));
  if (typeof message !== "string")
    throw new TypeError("'message' must be type string");
  iterFn = singleCheck === false ?
    Array.prototype.every :
    Array.prototype.some;

  for (var i = 1; i < _arguments.length; i++) {
    exp = _arguments[i];

    if (typeof exp === "function") {
      debug("constructor already in", !!(~alreadyC.indexOf(exp)));
      if (!(~alreadyC.indexOf(exp))) {
        checkQueue.push(function () {
          var exp2 = exp;
          return function () {
            debug("instanceof Const", arg, exp2);
            return arg instanceof exp2;
          };
        }());
        alreadyC.push(exp);
      }
    } else if (typeof exp !== "string") {
      throw new TypeError("`expected` must be a constructor or string");
    } else {
      for (var type in types) {
        if (!types.hasOwnProperty(type)) continue;

        if ((reRes = types[type][0](exp)) && !(~already.indexOf(type))) {
          fn = (function () {
            var check, negated, negLength;

            check = types[type][1];
            negLength = reRes[1].length;

            negated = negLength ? !!(negLength % 2) : false;
            debug("negated ", negated);

            return function () {
              return negated ? !check(arg) : check(arg);
            };
          }());

          already.push(type);
          checkQueue.push(fn);
        }
      }
    }
  }
    debug("checkQueue: " + checkQueue);
    debug("already: " + already);
    res = iterFn.call(checkQueue, function (fn) {
      return fn();
    });
    debug("res " + res);

    if (shouldThrow && false === res) throw new ArgError(message);
    else return res;
};

/**
  * @api public
  * @param {String} [name]
  * @param {Function} checkFn
  * @param {String} ...
  * @return {void|String} [name]
  */
module.exports.newType = function (name, checkFn) {
  if ("string" !== typeof name) {
    checkFn = name;
    name = "type" + idCount();
    noname = true;
    sliceAt = 1;
  } else {
    sliceAt = 2;
  }

  aliases = [].slice.call(arguments, sliceAt);

  var aliases, sliceAt, taken, noname;

  if (false !== (taken = aliasesTaken(aliases)))
    throw new Error("alias '" + taken + "' is taken");
  newType(name, checkFn, aliases);

  if (true === noname) return name;
};

var id = 1;
function idCount () {
  return id++;
}

// return false if _any_ one of them is in use
function aliasesTaken (arr) {
  var taken
  for (var ind in arr) {
    if (!arr.hasOwnProperty(ind)) continue;
    if (aliasTaken(arr[ind]) !== false) return arr[ind];
  }
  return false;
}

function aliasTaken () {
  for (var name in types) {
    if (!types.hasOwnProperty(name)) continue;

    debug("aliasTaken() name %s, types[name] %j", name, types[name]);
    if (types[name][0](arguments[0])) return name;
  }

  return false;
}


module.exports.ArgError = ArgError;
