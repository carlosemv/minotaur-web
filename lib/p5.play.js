/*
p5.play
by Paolo Pedercini/molleindustria, 2015
http://molleindustria.org/
*/

(function(root, factory) {
if (typeof define === 'function' && define.amd)
define('p5.play', ['p5'], function(p5) { (factory(p5)); });
else if (typeof exports === 'object')
factory(require('./p5'));
else
factory(root.p5);
}(this, function(p5) {
/**
 * p5.play is a library for p5.js to facilitate the creation of games and gamelike
 * projects.
 *
 * It provides a flexible Sprite class to manage visual objects in 2D space
 * and features such as animation support, basic collision detection
 * and resolution, mouse and keyboard interactions, and a virtual camera.
 *
 * p5.play is not a box2D-derived physics engine, it doesn't use events, and it's
 * designed to be understood and possibly modified by intermediate programmers.
 *
 * See the examples folder for more info on how to use this library.
 *
 * @module p5.play
 * @submodule p5.play
 * @for p5.play
 * @main
 */

// =============================================================================
//                         initialization
// =============================================================================

// This is the new way to initialize custom p5 properties for any p5 instance.
// The goal is to migrate lazy P5 properties over to this method.
// @see https://github.com/molleindustria/p5.play/issues/46
p5.prototype.registerMethod('init', function p5PlayInit() {
});

// This provides a way for us to lazily define properties that
// are global to p5 instances.
//
// Note that this isn't just an optimization: p5 currently provides no
// way for add-ons to be notified when new p5 instances are created, so
// lazily creating these properties is the *only* mechanism available
// to us. For more information, see:
//
// https://github.com/processing/p5.js/issues/1263
function defineLazyP5Property(name, getter) {
  Object.defineProperty(p5.prototype, name, {
    configurable: true,
    enumerable: true,
    get: function() {
      var context = (this instanceof p5 && !this._isGlobal) ? this : window;

      if (typeof(context._p5PlayProperties) === 'undefined') {
        context._p5PlayProperties = {};
      }
      if (!(name in context._p5PlayProperties)) {
        context._p5PlayProperties[name] = getter.call(context);
      }
      return context._p5PlayProperties[name];
    }
  });
}

// This returns a factory function, suitable for passing to
// defineLazyP5Property, that returns a subclass of the given
// constructor that is always bound to a particular p5 instance.
function boundConstructorFactory(constructor) {
  if (typeof(constructor) !== 'function')
    throw new Error('constructor must be a function');

  return function createBoundConstructor() {
    var pInst = this;

    function F() {
      var args = Array.prototype.slice.call(arguments);

      return constructor.apply(this, [pInst].concat(args));
    }
    F.prototype = constructor.prototype;

    return F;
  };
}

// This is a utility that makes it easy to define convenient aliases to
// pre-bound p5 instance methods.
//
// For example:
//
//   var pInstBind = createPInstBinder(pInst);
//
//   var createVector = pInstBind('createVector');
//   var loadImage = pInstBind('loadImage');
//
// The above will create functions createVector and loadImage, which can be
// used similar to p5 global mode--however, they're bound to specific p5
// instances, and can thus be used outside of global mode.
function createPInstBinder(pInst) {
  return function pInstBind(methodName) {
    var method = pInst[methodName];

    if (typeof(method) !== 'function')
      throw new Error('"' + methodName + '" is not a p5 method');
    return method.bind(pInst);
  };
}

// These are utility p5 functions that don't depend on p5 instance state in
// order to work properly, so we'll go ahead and make them easy to
// access without needing to bind them to a p5 instance.
var abs = p5.prototype.abs;
var radians = p5.prototype.radians;
var dist = p5.prototype.dist;
var degrees = p5.prototype.degrees;
var pow = p5.prototype.pow;
var round = p5.prototype.round;

//variable to detect instant presses
defineLazyP5Property('_p5play', function() {
  return {
    keyStates: {},
    mouseStates: {}
  };
});

var KEY_IS_UP = 0;
var KEY_WENT_DOWN = 1;
var KEY_IS_DOWN = 2;
var KEY_WENT_UP = 3;

/**
* Detects if a key was pressed during the last cycle.
* It can be used to trigger events once, when a key is pressed or released.
* Example: Super Mario jumping.
*
* @method keyWentDown
* @param {Number|String} key Key code or character
* @return {Boolean} True if the key was pressed
*/
p5.prototype.keyWentDown = function(key) {
  return this._isKeyInState(key, KEY_WENT_DOWN);
};


/**
* Detects if a key was released during the last cycle.
* It can be used to trigger events once, when a key is pressed or released.
* Example: Spaceship shooting.
*
* @method keyWentUp
* @param {Number|String} key Key code or character
* @return {Boolean} True if the key was released
*/
p5.prototype.keyWentUp = function(key) {
  return this._isKeyInState(key, KEY_WENT_UP);
};

/**
* Detects if a key is currently pressed
* Like p5 keyIsDown but accepts strings and codes
*
* @method keyDown
* @param {Number|String} key Key code or character
* @return {Boolean} True if the key is down
*/
p5.prototype.keyDown = function(key) {
  return this._isKeyInState(key, KEY_IS_DOWN);
};

/**
 * Detects if a key is in the given state during the last cycle.
 * Helper method encapsulating common key state logic; it may be preferable
 * to call keyDown or other methods directly.
 *
 * @private
 * @method _isKeyInState
 * @param {Number|String} key Key code or character
 * @param {Number} state Key state to check against
 * @return {Boolean} True if the key is in the given state
 */
p5.prototype._isKeyInState = function(key, state) {
  var keyCode;
  var keyStates = this._p5play.keyStates;

  if(typeof key === 'string')
  {
    keyCode = this._keyCodeFromAlias(key);
  }
  else
  {
    keyCode = key;
  }

  //if undefined start checking it
  if(keyStates[keyCode]===undefined)
  {
    if(this.keyIsDown(keyCode))
      keyStates[keyCode] = KEY_IS_DOWN;
    else
      keyStates[keyCode] = KEY_IS_UP;
  }

  return (keyStates[keyCode] === state);
};

/**
* Detects if a mouse button is currently down
* Combines mouseIsPressed and mouseButton of p5
*
* @method mouseDown
* @param {Number} [buttonCode] Mouse button constant LEFT, RIGHT or CENTER
* @return {Boolean} True if the button is down
*/
p5.prototype.mouseDown = function(buttonCode) {
  return this._isMouseButtonInState(buttonCode, KEY_IS_DOWN);
};

/**
* Detects if a mouse button is currently up
* Combines mouseIsPressed and mouseButton of p5
*
* @method mouseUp
* @param {Number} [buttonCode] Mouse button constant LEFT, RIGHT or CENTER
* @return {Boolean} True if the button is up
*/
p5.prototype.mouseUp = function(buttonCode) {
  return this._isMouseButtonInState(buttonCode, KEY_IS_UP);
};

/**
 * Detects if a mouse button was released during the last cycle.
 * It can be used to trigger events once, to be checked in the draw cycle
 *
 * @method mouseWentUp
 * @param {Number} [buttonCode] Mouse button constant LEFT, RIGHT or CENTER
 * @return {Boolean} True if the button was just released
 */
p5.prototype.mouseWentUp = function(buttonCode) {
  return this._isMouseButtonInState(buttonCode, KEY_WENT_UP);
};


/**
 * Detects if a mouse button was pressed during the last cycle.
 * It can be used to trigger events once, to be checked in the draw cycle
 *
 * @method mouseWentDown
 * @param {Number} [buttonCode] Mouse button constant LEFT, RIGHT or CENTER
 * @return {Boolean} True if the button was just pressed
 */
p5.prototype.mouseWentDown = function(buttonCode) {
  return this._isMouseButtonInState(buttonCode, KEY_WENT_DOWN);
};

/**
 * Detects if a mouse button is in the given state during the last cycle.
 * Helper method encapsulating common mouse button state logic; it may be
 * preferable to call mouseWentUp, etc, directly.
 *
 * @private
 * @method _isMouseButtonInState
 * @param {Number} [buttonCode] Mouse button constant LEFT, RIGHT or CENTER
 * @param {Number} state
 * @return {boolean} True if the button was in the given state
 */
p5.prototype._isMouseButtonInState = function(buttonCode, state) {
  var mouseStates = this._p5play.mouseStates;

  if(buttonCode === undefined)
    buttonCode = this.LEFT;

  //undefined = not tracked yet, start tracking
  if(mouseStates[buttonCode]===undefined)
  {
  if(this.mouseIsPressed && this.mouseButton === buttonCode)
    mouseStates[buttonCode] = KEY_IS_DOWN;
  else
    mouseStates[buttonCode] = KEY_IS_UP;
  }

  return (mouseStates[buttonCode] === state);
};


/**
 * An object storing all useful keys for easy access
 * Key.tab = 9
 *
 * @private
 * @property KEY
 * @type {Object}
 */
p5.prototype.KEY = {
    'BACKSPACE': 8,
    'TAB': 9,
    'ENTER': 13,
    'SHIFT': 16,
    'CTRL': 17,
    'ALT': 18,
    'PAUSE': 19,
    'CAPS_LOCK': 20,
    'ESC': 27,
    'SPACE': 32,
    ' ': 32,
    'PAGE_UP': 33,
    'PAGE_DOWN': 34,
    'END': 35,
    'HOME': 36,
    'LEFT_ARROW': 37,
    'LEFT': 37,
    'UP_ARROW': 38,
    'UP': 38,
    'RIGHT_ARROW': 39,
    'RIGHT': 39,
    'DOWN_ARROW': 40,
    'DOWN': 40,
    'INSERT': 45,
    'DELETE': 46,
    '0': 48,
    '1': 49,
    '2': 50,
    '3': 51,
    '4': 52,
    '5': 53,
    '6': 54,
    '7': 55,
    '8': 56,
    '9': 57,
    'A': 65,
    'B': 66,
    'C': 67,
    'D': 68,
    'E': 69,
    'F': 70,
    'G': 71,
    'H': 72,
    'I': 73,
    'J': 74,
    'K': 75,
    'L': 76,
    'M': 77,
    'N': 78,
    'O': 79,
    'P': 80,
    'Q': 81,
    'R': 82,
    'S': 83,
    'T': 84,
    'U': 85,
    'V': 86,
    'W': 87,
    'X': 88,
    'Y': 89,
    'Z': 90,
    '0NUMPAD': 96,
    '1NUMPAD': 97,
    '2NUMPAD': 98,
    '3NUMPAD': 99,
    '4NUMPAD': 100,
    '5NUMPAD': 101,
    '6NUMPAD': 102,
    '7NUMPAD': 103,
    '8NUMPAD': 104,
    '9NUMPAD': 105,
    'MULTIPLY': 106,
    'PLUS': 107,
    'MINUS': 109,
    'DOT': 110,
    'SLASH1': 111,
    'F1': 112,
    'F2': 113,
    'F3': 114,
    'F4': 115,
    'F5': 116,
    'F6': 117,
    'F7': 118,
    'F8': 119,
    'F9': 120,
    'F10': 121,
    'F11': 122,
    'F12': 123,
    'EQUAL': 187,
    'COMMA': 188,
    'SLASH': 191,
    'BACKSLASH': 220
};

/**
 * An object storing deprecated key aliases, which we still support but
 * should be mapped to valid aliases and generate warnings.
 *
 * @private
 * @property KEY_DEPRECATIONS
 * @type {Object}
 */
p5.prototype.KEY_DEPRECATIONS = {
  'MINUT': 'MINUS',
  'COMA': 'COMMA'
};

/**
 * Given a string key alias (as defined in the KEY property above), look up
 * and return the numeric JavaScript key code for that key.  If a deprecated
 * alias is passed (as defined in the KEY_DEPRECATIONS property) it will be
 * mapped to a valid key code, but will also generate a warning about use
 * of the deprecated alias.
 *
 * @private
 * @method _keyCodeFromAlias
 * @param {!string} alias - a case-insensitive key alias
 * @return {number|undefined} a numeric JavaScript key code, or undefined
 *          if no key code matching the given alias is found.
 */
p5.prototype._keyCodeFromAlias = function(alias) {
  alias = alias.toUpperCase();
  if (this.KEY_DEPRECATIONS[alias]) {
    this._warn('Key literal "' + alias + '" is deprecated and may be removed ' +
      'in a future version of p5.play. ' +
      'Please use "' + this.KEY_DEPRECATIONS[alias] + '" instead.');
    alias = this.KEY_DEPRECATIONS[alias];
  }
  return this.KEY[alias];
};

//pre draw: detect keyStates
p5.prototype.readPresses = function() {
  var keyStates = this._p5play.keyStates;
  var mouseStates = this._p5play.mouseStates;

  for (var key in keyStates) {
    if(this.keyIsDown(key)) //if is down
    {
      if(keyStates[key] === KEY_IS_UP)//and was up
        keyStates[key] = KEY_WENT_DOWN;
      else
        keyStates[key] = KEY_IS_DOWN; //now is simply down
    }
    else //if it's up
    {
      if(keyStates[key] === KEY_IS_DOWN)//and was up
        keyStates[key] = KEY_WENT_UP;
      else
        keyStates[key] = KEY_IS_UP; //now is simply down
    }
  }

  //mouse
  for (var btn in mouseStates) {

    if(this.mouseIsPressed && this.mouseButton === btn) //if is down
    {
      if(mouseStates[btn] === KEY_IS_UP)//and was up
        mouseStates[btn] = KEY_WENT_DOWN;
      else
        mouseStates[btn] = KEY_IS_DOWN; //now is simply down
    }
    else //if it's up
    {
      if(mouseStates[btn] === KEY_IS_DOWN)//and was up
        mouseStates[btn] = KEY_WENT_UP;
      else
        mouseStates[btn] = KEY_IS_UP; //now is simply down
    }
  }

};

//general constructor to be able to feed arguments as array
function construct(constructor, args) {
  function F() {
    return constructor.apply(this, args);
  }
  F.prototype = constructor.prototype;
  return new F();
}

//keyboard input
p5.prototype.registerMethod('pre', p5.prototype.readPresses);

/**
 * Log a warning message to the host console, using native `console.warn`
 * if it is available but falling back on `console.log` if not.  If no
 * console is available, this method will fail silently.
 * @method _warn
 * @param {!string} message
 * @private
 */
p5.prototype._warn = function(message) {
  var console = window.console;

  if(console)
  {
    if('function' === typeof console.warn)
    {
      console.warn(message);
    }
    else if('function' === typeof console.log)
    {
      console.log('Warning: ' + message);
    }
  }
};

}));
