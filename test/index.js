"use strict";

typeof process.env.DEBUG === "string" ? process.env.DEBUG += ",ch-arge:index.js" :
process.env.DEBUG = "ch-arge:index.js";

var charge = require("../lib");
var assert = require("assert");

// charge with arg as expected instance of constructor
assert(charge([], Array));

assert.doesNotThrow(function(){charge([], Object)});

assert.equal(charge([], Object, false), true);

assert.equal(charge("", Object, false), false);

// charge with string as second arg
assert.ok(charge([], "array"));

// same with shorthand
assert.ok(charge([], "arr"));

// same with more possibilites
assert(charge({}, "array object"));

// arg error
assert.throws(function() {charge([], "str")}, charge.ArgError);
// argError instanceof Error
assert.equal(true, (new charge.ArgError) instanceof Error);

// argError instanceof ArgError
assert.equal(true, (new charge.ArgError) instanceof charge.ArgError);
