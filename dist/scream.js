/**
 * @version 2.0.8
 * @link https://github.com/gajus/scream for the canonical source repository
 * @license https://github.com/gajus/scream/blob/master/LICENSE BSD 3-Clause
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var Event,
    Sister = require('sister');

Event = function Event (config) {
    var event,
        lastEnd,
        eventEmitter;

    if (!(this instanceof Event)) {
        return new Event(config);
    }

    eventEmitter = Sister();

    event = this;
    event.on = eventEmitter.on;

    config = config || {};

    /**
     * @var {Number} Number of iterations the subject of interval inspection must not mutate to fire "orientationchangeend".
     */
    config.noChangeCountToEnd = config.noChangeCountToEnd || 100;
    /**
     * @var {Number} Number of milliseconds after which fire the "orientationchangeend" if interval inspection did not do it before.
     */
    config.noEndTimeout = 1000 || config.noEndTimeout;
    /**
     * @var {Boolean} Enables logging of the events.
     */
    config.debug = config.debug || false;

    global
        .addEventListener('orientationchange', function () {
            var interval,
                timeout,
                end,
                lastInnerWidth,
                lastInnerHeight,
                noChangeCount;

            end = function (dispatchEvent) {
                clearInterval(interval);
                clearTimeout(timeout);

                interval = null;
                timeout = null;

                if (dispatchEvent) {
                    eventEmitter.trigger('orientationchangeend');
                }
            };

            // If there is a series of orientationchange events fired one after another,
            // where n event orientationchangeend event has not been fired before the n+2 orientationchange,
            // then orientationchangeend will fire only for the last orientationchange event in the series.
            if (lastEnd) {
                lastEnd(false);
            }

            lastEnd = end;

            interval = setInterval(function () {
                if (global.innerWidth === lastInnerWidth && global.innerHeight === lastInnerHeight) {
                    noChangeCount++;

                    if (noChangeCount === config.noChangeCountToEnd) {
                        if (config.debug) {
                            console.debug('setInterval');
                        }

                        end(true);
                    }
                } else {
                    lastInnerWidth = global.innerWidth;
                    lastInnerHeight = global.innerHeight;
                    noChangeCount = 0;
                }
            });
            timeout = setTimeout(function () {
                if (config.debug) {
                    console.debug('setTimeout');
                }

                end(true);
            }, config.noEndTimeout);
        });
}

global.gajus = global.gajus || {};
global.gajus.orientationchangeend = Event;

module.exports = Event;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"sister":2}],2:[function(require,module,exports){
(function (global){
/**
* @link https://github.com/gajus/sister for the canonical source repository
* @license https://github.com/gajus/sister/blob/master/LICENSE BSD 3-Clause
*/
function Sister () {
    var sister = {},
        events = {};

    /**
     * @name handler
     * @function
     * @param {Object} data Event data.
     */

    /**
     * @param {String} name Event name.
     * @param {handler} handler
     * @return {listener}
     */
    sister.on = function (name, handler) {
        var listener = {name: name, handler: handler};
        events[name] = events[name] || [];
        events[name].unshift(listener);
        return listener;
    };

    /**
     * @param {listener}
     */
    sister.off = function (listener) {
        var index = events[listener.name].indexOf(listener);

        if (index != -1) {
            events[listener.name].splice(index, 1);
        }
    };

    /**
     * @param {String} name Event name.
     * @param {Object} data Event data.
     */
    sister.trigger = function (name, data) {
        var listeners = events[name],
            i;

        if (listeners) {
            i = listeners.length;
            while (i--) {
                listeners[i].handler(data);
            }
        }
    };

    return sister;
}

global.gajus = global.gajus || {};
global.gajus.Sister = Sister;

module.exports = Sister;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
(function (global){
var Scream,
    Sister = require('sister'),
    OCE = require('orientationchangeend')();
    
Scream = function Scream (config) {
    var scream,
        eventEmitter;

    if (!(this instanceof Scream)) {
        return new Scream(config);
    }

    scream = this;

    eventEmitter = Sister();

    config = config || {};

    config.width = config.width || {};

    if (!config.width.portrait) {
        config.width.portrait = global.screen.width;
    }

    if (!config.width.landscape) {
        config.width.landscape = global.screen.width;
    }

    /**
     * Viewport width relative to the device orientation.
     *
     * @return {Number}
     */
    scream.getViewportWidth = function () {
        return config.width[scream.getOrientation()];
    };

    /**
     * Viewport height relative to the device orientation and to scale with the viewport width.
     *
     * @return {Number}
     */
    scream.getViewportHeight = function () {
        return Math.round(scream.getScreenHeight() / scream.getScale());
    };

    /**
     * The ratio between screen width and viewport width.
     *
     * @return {Number}
     */
    scream.getScale = function () {
        return scream.getScreenWidth()/scream.getViewportWidth();
    };

    /**
     * @return {String} portrait|landscape
     */
    scream.getOrientation = function () {
        return global.orientation === 0 ? 'portrait' : 'landscape';
    };

    /**
     * Screen width relative to the device orientation.
     * 
     * @return {Number}
     */
    scream.getScreenWidth = function () {
        return global.screen[scream.getOrientation() === 'portrait' ? 'width' : 'height'];
    };

    /**
     * Screen width relative to the device orientation.
     * 
     * @return {Number}
     */
    scream.getScreenHeight = function () {
        return global.screen[scream.getOrientation() === 'portrait' ? 'height' : 'width'];
    };

    /**
     * Generates a viewport tag reflecting the content width relative to the device orientation
     * and scale required to fit the content in the viewport.
     *
     * Appends the tag to the document.head and removes the preceding additions.
     */
    scream._updateViewport = function () {
        var oldViewport,
            viewport,
            width,
            scale,
            content;

        width = scream.getViewportWidth();
        scale = scream.getScale();

        content = 
             'width=' + width +
            ', initial-scale=' + scale +
            ', minimum-scale=' + scale +
            ', maximum-scale=' + scale +
            ', user-scalable=0';
        
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = content;

        oldViewport = global.document.head.querySelector('meta[name="viewport"]');

        if (oldViewport) {
            oldViewport.parentNode.removeChild(oldViewport);
        }

        global.document.head.appendChild(viewport);
    };

    /**
     * Uses static device environment variables (screen.width, screen.height, devicePixelRatio) to recognize device spec.
     * 
     * @return {Array} spec
     * @return {Number} spec[0] window.innerWidth when device is in a portrait orientation, scale 0.25 and page is the minimal view
     * @return {Number} spec[1] window.innerHeight when device is in a portrait orientation, scale 0.25 and page is the minimal view
     * @return {Number} spec[2] window.innerWidth when device is in a landscape orientation, scale 0.25 and page is the minimal view
     * @return {Number} spec[3] window.innerHeight when device is in a landscape orientation, scale 0.25 and page is the minimal view
     * @return {Number} spec[4] screen.width
     * @return {Number} spec[5] screen.height
     * @return {Number} spec[6] devicePixelRatio
     * @return {String} spec[7] name
     */
    scream._deviceSpec = function () {
        var specs,
            spec,
            i;

        specs = [
            [1280, 1762, 1920, 1280, 320, 480, 2, 'iPhone 4'],
            [1280, 2114, 2272, 1280, 320, 568, 2, 'iPhone 5 or 5s'],
            [1500, 2510, 2668, 1500, 375, 667, 2, 'iPhone 6'],
            [1656, 2785, 2944, 1656, 414, 736, 3, 'iPhone 6 plus'],
			[1500, 2509, 2668, 1500, 375, 667, 3, 'iPhone 6 plus (Zoomed)'],
            [3072, 3936, 4096, 2912, 768, 1024, 1, 'iPad 2'],
            [3072, 3938, 4096, 2914, 768, 1024, 2, 'iPad Air or Retina']
        ];

        i = specs.length;

        while (i--) {
            if (global.screen.width === specs[i][4] &&
                global.screen.height === specs[i][5] &&
                global.devicePixelRatio === specs[i][6]) {

                spec = specs[i];

                break;
            }
        }
		
		if (!spec) {
          spec = [(global.screen.width * 4), (global.screen.height * 4 - 39.5), (global.screen.height * 4), (global.screen.width * 4), global.devicePixelRatio, 'Crazy iPhone'];
        }

        return spec;
    }

    /**
     * Returns height of the usable viewport in the minimal view relative to the current viewport width.
     * 
     * This method will work with iOS8 only.
     * 
     * @see http://stackoverflow.com/questions/26827822/how-is-the-window-innerheight-derived-of-the-minimal-view/26827842
     * @see http://stackoverflow.com/questions/26801943/how-to-get-the-window-size-of-fullscream-view-when-not-in-fullscream
     * @return {Number}
     */
    scream._getMinimalViewHeight = function () {
        var spec,
            height,
            orientation = scream.getOrientation();

        spec = scream._deviceSpec();

        if (!spec) {
            throw new Error('Not a known iOS device. If you are using an iOS device, report it to https://github.com/gajus/scream/issues/1.');
        }

        if (orientation === 'portrait') {
            height = Math.round((scream.getViewportWidth() * spec[1]) / spec[0]);
        } else {
            height = Math.round((scream.getViewportWidth() * spec[3]) / spec[2]);
        }

        return height;
    };

    /**
     * Returns dimensions of the usable viewport in the minimal view relative to the current viewport width and orientation.
     * 
     * @return {Object} dimensions
     * @return {Number} dimensions.width
     * @return {Number} dimensions.height
     */
    scream.getMinimalViewSize = function () {
        var width = scream.getViewportWidth(),
            height = scream._getMinimalViewHeight();

        return {
            width: width,
            height: height
        };
    };

    /**
     * Returns true if screen is in "minimal" UI.
     *
     * iOS 8 has removed the minimal-ui viewport property.
     * Nevertheless, user can enter minimal-ui using touch-drag-down gesture.
     * This method is used to detect if user is in minimal-ui view.
     *
     * In case of orientation change, the state of the view can be accurately
     * determined only after orientationchangeend event.
     * 
     * @return {Boolean}
     */
    scream.isMinimalView = function () {
        // It is enough to check the height, because the viewport is based on width.
        return global.innerHeight == scream.getMinimalViewSize().height;
    };

    /**
     * Detect when view changes from full to minimal and vice-versa.
     */
    scream._detectViewChange = (function () {
        var lastView;

        // This method will only with iOS 8.
        // Overwrite the event handler to prevent an error.
        if (!scream._deviceSpec()) {
            console.log('View change detection has been disabled. Unrecognized device. If you are using an iOS device, report it to https://github.com/gajus/scream/issues/1.');

            return function () {};
        }

        return function () {
            var currentView = scream.isMinimalView() ? 'minimal' : 'full';

            if (lastView != currentView) {
                eventEmitter.trigger('viewchange', {
                    viewName: currentView
                });

                lastView = currentView;
            }
        }
    } ());

    scream._setupDOMEventListeners = function () {
        var isOrientationChanging;

        // Media matcher is the first to pick up the orientation change.
        global
            .matchMedia('(orientation: portrait)')
            .addListener(function (m) {
                isOrientationChanging = true;
            });

        OCE.on('orientationchangeend', function () {
            isOrientationChanging = false;

            scream._updateViewport();
            scream._detectViewChange();

            eventEmitter.trigger('orientationchangeend');
        });

        global.addEventListener('orientationchange', function () {
            scream._updateViewport();
        });

        global.addEventListener('resize', function () {
            if (!isOrientationChanging) {
                scream._detectViewChange();
            }
        });

        // iPhone 6 plus does not trigger resize event when leaving the minimal-ui in the landscape orientation.
        global.addEventListener('scroll', function () {
            if (!isOrientationChanging) {
                scream._detectViewChange();
            }
        });

        setTimeout(function () {
            scream._detectViewChange();
        });
    };

    scream._updateViewport();
    scream._setupDOMEventListeners();

    scream.on = eventEmitter.on;
};

global.gajus = global.gajus || {};
global.gajus.Scream = Scream;

module.exports = Scream;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"orientationchangeend":1,"sister":2}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkQ6XFxMb25hbG9cXENvZGVcXExOQk1vYmlsZVxcc2NyZWFtXFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJEOi9Mb25hbG8vQ29kZS9MTkJNb2JpbGUvc2NyZWFtL25vZGVfbW9kdWxlcy9vcmllbnRhdGlvbmNoYW5nZWVuZC9zcmMvb3JpZW50YXRpb25jaGFuZ2VlbmQuanMiLCJEOi9Mb25hbG8vQ29kZS9MTkJNb2JpbGUvc2NyZWFtL25vZGVfbW9kdWxlcy9zaXN0ZXIvc3JjL3Npc3Rlci5qcyIsIkQ6L0xvbmFsby9Db2RlL0xOQk1vYmlsZS9zY3JlYW0vc3JjL2Zha2VfNjA0ZGUyNGIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgRXZlbnQsXG4gICAgU2lzdGVyID0gcmVxdWlyZSgnc2lzdGVyJyk7XG5cbkV2ZW50ID0gZnVuY3Rpb24gRXZlbnQgKGNvbmZpZykge1xuICAgIHZhciBldmVudCxcbiAgICAgICAgbGFzdEVuZCxcbiAgICAgICAgZXZlbnRFbWl0dGVyO1xuXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEV2ZW50KSkge1xuICAgICAgICByZXR1cm4gbmV3IEV2ZW50KGNvbmZpZyk7XG4gICAgfVxuXG4gICAgZXZlbnRFbWl0dGVyID0gU2lzdGVyKCk7XG5cbiAgICBldmVudCA9IHRoaXM7XG4gICAgZXZlbnQub24gPSBldmVudEVtaXR0ZXIub247XG5cbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG5cbiAgICAvKipcbiAgICAgKiBAdmFyIHtOdW1iZXJ9IE51bWJlciBvZiBpdGVyYXRpb25zIHRoZSBzdWJqZWN0IG9mIGludGVydmFsIGluc3BlY3Rpb24gbXVzdCBub3QgbXV0YXRlIHRvIGZpcmUgXCJvcmllbnRhdGlvbmNoYW5nZWVuZFwiLlxuICAgICAqL1xuICAgIGNvbmZpZy5ub0NoYW5nZUNvdW50VG9FbmQgPSBjb25maWcubm9DaGFuZ2VDb3VudFRvRW5kIHx8IDEwMDtcbiAgICAvKipcbiAgICAgKiBAdmFyIHtOdW1iZXJ9IE51bWJlciBvZiBtaWxsaXNlY29uZHMgYWZ0ZXIgd2hpY2ggZmlyZSB0aGUgXCJvcmllbnRhdGlvbmNoYW5nZWVuZFwiIGlmIGludGVydmFsIGluc3BlY3Rpb24gZGlkIG5vdCBkbyBpdCBiZWZvcmUuXG4gICAgICovXG4gICAgY29uZmlnLm5vRW5kVGltZW91dCA9IDEwMDAgfHwgY29uZmlnLm5vRW5kVGltZW91dDtcbiAgICAvKipcbiAgICAgKiBAdmFyIHtCb29sZWFufSBFbmFibGVzIGxvZ2dpbmcgb2YgdGhlIGV2ZW50cy5cbiAgICAgKi9cbiAgICBjb25maWcuZGVidWcgPSBjb25maWcuZGVidWcgfHwgZmFsc2U7XG5cbiAgICBnbG9iYWxcbiAgICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGludGVydmFsLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICAgICAgZW5kLFxuICAgICAgICAgICAgICAgIGxhc3RJbm5lcldpZHRoLFxuICAgICAgICAgICAgICAgIGxhc3RJbm5lckhlaWdodCxcbiAgICAgICAgICAgICAgICBub0NoYW5nZUNvdW50O1xuXG4gICAgICAgICAgICBlbmQgPSBmdW5jdGlvbiAoZGlzcGF0Y2hFdmVudCkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcblxuICAgICAgICAgICAgICAgIGludGVydmFsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIGlmIChkaXNwYXRjaEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50RW1pdHRlci50cmlnZ2VyKCdvcmllbnRhdGlvbmNoYW5nZWVuZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgc2VyaWVzIG9mIG9yaWVudGF0aW9uY2hhbmdlIGV2ZW50cyBmaXJlZCBvbmUgYWZ0ZXIgYW5vdGhlcixcbiAgICAgICAgICAgIC8vIHdoZXJlIG4gZXZlbnQgb3JpZW50YXRpb25jaGFuZ2VlbmQgZXZlbnQgaGFzIG5vdCBiZWVuIGZpcmVkIGJlZm9yZSB0aGUgbisyIG9yaWVudGF0aW9uY2hhbmdlLFxuICAgICAgICAgICAgLy8gdGhlbiBvcmllbnRhdGlvbmNoYW5nZWVuZCB3aWxsIGZpcmUgb25seSBmb3IgdGhlIGxhc3Qgb3JpZW50YXRpb25jaGFuZ2UgZXZlbnQgaW4gdGhlIHNlcmllcy5cbiAgICAgICAgICAgIGlmIChsYXN0RW5kKSB7XG4gICAgICAgICAgICAgICAgbGFzdEVuZChmYWxzZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxhc3RFbmQgPSBlbmQ7XG5cbiAgICAgICAgICAgIGludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChnbG9iYWwuaW5uZXJXaWR0aCA9PT0gbGFzdElubmVyV2lkdGggJiYgZ2xvYmFsLmlubmVySGVpZ2h0ID09PSBsYXN0SW5uZXJIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9DaGFuZ2VDb3VudCsrO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChub0NoYW5nZUNvdW50ID09PSBjb25maWcubm9DaGFuZ2VDb3VudFRvRW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1Zygnc2V0SW50ZXJ2YWwnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbGFzdElubmVyV2lkdGggPSBnbG9iYWwuaW5uZXJXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgbGFzdElubmVySGVpZ2h0ID0gZ2xvYmFsLmlubmVySGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBub0NoYW5nZUNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ3NldFRpbWVvdXQnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBlbmQodHJ1ZSk7XG4gICAgICAgICAgICB9LCBjb25maWcubm9FbmRUaW1lb3V0KTtcbiAgICAgICAgfSk7XG59XG5cbmdsb2JhbC5nYWp1cyA9IGdsb2JhbC5nYWp1cyB8fCB7fTtcbmdsb2JhbC5nYWp1cy5vcmllbnRhdGlvbmNoYW5nZWVuZCA9IEV2ZW50O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50O1xufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vKipcbiogQGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2dhanVzL3Npc3RlciBmb3IgdGhlIGNhbm9uaWNhbCBzb3VyY2UgcmVwb3NpdG9yeVxuKiBAbGljZW5zZSBodHRwczovL2dpdGh1Yi5jb20vZ2FqdXMvc2lzdGVyL2Jsb2IvbWFzdGVyL0xJQ0VOU0UgQlNEIDMtQ2xhdXNlXG4qL1xuZnVuY3Rpb24gU2lzdGVyICgpIHtcbiAgICB2YXIgc2lzdGVyID0ge30sXG4gICAgICAgIGV2ZW50cyA9IHt9O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgaGFuZGxlclxuICAgICAqIEBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIEV2ZW50IGRhdGEuXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBFdmVudCBuYW1lLlxuICAgICAqIEBwYXJhbSB7aGFuZGxlcn0gaGFuZGxlclxuICAgICAqIEByZXR1cm4ge2xpc3RlbmVyfVxuICAgICAqL1xuICAgIHNpc3Rlci5vbiA9IGZ1bmN0aW9uIChuYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lciA9IHtuYW1lOiBuYW1lLCBoYW5kbGVyOiBoYW5kbGVyfTtcbiAgICAgICAgZXZlbnRzW25hbWVdID0gZXZlbnRzW25hbWVdIHx8IFtdO1xuICAgICAgICBldmVudHNbbmFtZV0udW5zaGlmdChsaXN0ZW5lcik7XG4gICAgICAgIHJldHVybiBsaXN0ZW5lcjtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtsaXN0ZW5lcn1cbiAgICAgKi9cbiAgICBzaXN0ZXIub2ZmID0gZnVuY3Rpb24gKGxpc3RlbmVyKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGV2ZW50c1tsaXN0ZW5lci5uYW1lXS5pbmRleE9mKGxpc3RlbmVyKTtcblxuICAgICAgICBpZiAoaW5kZXggIT0gLTEpIHtcbiAgICAgICAgICAgIGV2ZW50c1tsaXN0ZW5lci5uYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIEV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgRXZlbnQgZGF0YS5cbiAgICAgKi9cbiAgICBzaXN0ZXIudHJpZ2dlciA9IGZ1bmN0aW9uIChuYW1lLCBkYXRhKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSBldmVudHNbbmFtZV0sXG4gICAgICAgICAgICBpO1xuXG4gICAgICAgIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyc1tpXS5oYW5kbGVyKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBzaXN0ZXI7XG59XG5cbmdsb2JhbC5nYWp1cyA9IGdsb2JhbC5nYWp1cyB8fCB7fTtcbmdsb2JhbC5nYWp1cy5TaXN0ZXIgPSBTaXN0ZXI7XG5cbm1vZHVsZS5leHBvcnRzID0gU2lzdGVyO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgU2NyZWFtLFxyXG4gICAgU2lzdGVyID0gcmVxdWlyZSgnc2lzdGVyJyksXHJcbiAgICBPQ0UgPSByZXF1aXJlKCdvcmllbnRhdGlvbmNoYW5nZWVuZCcpKCk7XHJcbiAgICBcclxuU2NyZWFtID0gZnVuY3Rpb24gU2NyZWFtIChjb25maWcpIHtcclxuICAgIHZhciBzY3JlYW0sXHJcbiAgICAgICAgZXZlbnRFbWl0dGVyO1xyXG5cclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTY3JlYW0pKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBTY3JlYW0oY29uZmlnKTtcclxuICAgIH1cclxuXHJcbiAgICBzY3JlYW0gPSB0aGlzO1xyXG5cclxuICAgIGV2ZW50RW1pdHRlciA9IFNpc3RlcigpO1xyXG5cclxuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcclxuXHJcbiAgICBjb25maWcud2lkdGggPSBjb25maWcud2lkdGggfHwge307XHJcblxyXG4gICAgaWYgKCFjb25maWcud2lkdGgucG9ydHJhaXQpIHtcclxuICAgICAgICBjb25maWcud2lkdGgucG9ydHJhaXQgPSBnbG9iYWwuc2NyZWVuLndpZHRoO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghY29uZmlnLndpZHRoLmxhbmRzY2FwZSkge1xyXG4gICAgICAgIGNvbmZpZy53aWR0aC5sYW5kc2NhcGUgPSBnbG9iYWwuc2NyZWVuLndpZHRoO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVmlld3BvcnQgd2lkdGggcmVsYXRpdmUgdG8gdGhlIGRldmljZSBvcmllbnRhdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHNjcmVhbS5nZXRWaWV3cG9ydFdpZHRoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBjb25maWcud2lkdGhbc2NyZWFtLmdldE9yaWVudGF0aW9uKCldO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFZpZXdwb3J0IGhlaWdodCByZWxhdGl2ZSB0byB0aGUgZGV2aWNlIG9yaWVudGF0aW9uIGFuZCB0byBzY2FsZSB3aXRoIHRoZSB2aWV3cG9ydCB3aWR0aC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHNjcmVhbS5nZXRWaWV3cG9ydEhlaWdodCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChzY3JlYW0uZ2V0U2NyZWVuSGVpZ2h0KCkgLyBzY3JlYW0uZ2V0U2NhbGUoKSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHJhdGlvIGJldHdlZW4gc2NyZWVuIHdpZHRoIGFuZCB2aWV3cG9ydCB3aWR0aC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHNjcmVhbS5nZXRTY2FsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gc2NyZWFtLmdldFNjcmVlbldpZHRoKCkvc2NyZWFtLmdldFZpZXdwb3J0V2lkdGgoKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IHBvcnRyYWl0fGxhbmRzY2FwZVxyXG4gICAgICovXHJcbiAgICBzY3JlYW0uZ2V0T3JpZW50YXRpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGdsb2JhbC5vcmllbnRhdGlvbiA9PT0gMCA/ICdwb3J0cmFpdCcgOiAnbGFuZHNjYXBlJztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTY3JlZW4gd2lkdGggcmVsYXRpdmUgdG8gdGhlIGRldmljZSBvcmllbnRhdGlvbi5cclxuICAgICAqIFxyXG4gICAgICogQHJldHVybiB7TnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBzY3JlYW0uZ2V0U2NyZWVuV2lkdGggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGdsb2JhbC5zY3JlZW5bc2NyZWFtLmdldE9yaWVudGF0aW9uKCkgPT09ICdwb3J0cmFpdCcgPyAnd2lkdGgnIDogJ2hlaWdodCddO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNjcmVlbiB3aWR0aCByZWxhdGl2ZSB0byB0aGUgZGV2aWNlIG9yaWVudGF0aW9uLlxyXG4gICAgICogXHJcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIHNjcmVhbS5nZXRTY3JlZW5IZWlnaHQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIGdsb2JhbC5zY3JlZW5bc2NyZWFtLmdldE9yaWVudGF0aW9uKCkgPT09ICdwb3J0cmFpdCcgPyAnaGVpZ2h0JyA6ICd3aWR0aCddO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlcyBhIHZpZXdwb3J0IHRhZyByZWZsZWN0aW5nIHRoZSBjb250ZW50IHdpZHRoIHJlbGF0aXZlIHRvIHRoZSBkZXZpY2Ugb3JpZW50YXRpb25cclxuICAgICAqIGFuZCBzY2FsZSByZXF1aXJlZCB0byBmaXQgdGhlIGNvbnRlbnQgaW4gdGhlIHZpZXdwb3J0LlxyXG4gICAgICpcclxuICAgICAqIEFwcGVuZHMgdGhlIHRhZyB0byB0aGUgZG9jdW1lbnQuaGVhZCBhbmQgcmVtb3ZlcyB0aGUgcHJlY2VkaW5nIGFkZGl0aW9ucy5cclxuICAgICAqL1xyXG4gICAgc2NyZWFtLl91cGRhdGVWaWV3cG9ydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgb2xkVmlld3BvcnQsXHJcbiAgICAgICAgICAgIHZpZXdwb3J0LFxyXG4gICAgICAgICAgICB3aWR0aCxcclxuICAgICAgICAgICAgc2NhbGUsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ7XHJcblxyXG4gICAgICAgIHdpZHRoID0gc2NyZWFtLmdldFZpZXdwb3J0V2lkdGgoKTtcclxuICAgICAgICBzY2FsZSA9IHNjcmVhbS5nZXRTY2FsZSgpO1xyXG5cclxuICAgICAgICBjb250ZW50ID0gXHJcbiAgICAgICAgICAgICAnd2lkdGg9JyArIHdpZHRoICtcclxuICAgICAgICAgICAgJywgaW5pdGlhbC1zY2FsZT0nICsgc2NhbGUgK1xyXG4gICAgICAgICAgICAnLCBtaW5pbXVtLXNjYWxlPScgKyBzY2FsZSArXHJcbiAgICAgICAgICAgICcsIG1heGltdW0tc2NhbGU9JyArIHNjYWxlICtcclxuICAgICAgICAgICAgJywgdXNlci1zY2FsYWJsZT0wJztcclxuICAgICAgICBcclxuICAgICAgICB2aWV3cG9ydCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ21ldGEnKTtcclxuICAgICAgICB2aWV3cG9ydC5uYW1lID0gJ3ZpZXdwb3J0JztcclxuICAgICAgICB2aWV3cG9ydC5jb250ZW50ID0gY29udGVudDtcclxuXHJcbiAgICAgICAgb2xkVmlld3BvcnQgPSBnbG9iYWwuZG9jdW1lbnQuaGVhZC5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9XCJ2aWV3cG9ydFwiXScpO1xyXG5cclxuICAgICAgICBpZiAob2xkVmlld3BvcnQpIHtcclxuICAgICAgICAgICAgb2xkVmlld3BvcnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChvbGRWaWV3cG9ydCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnbG9iYWwuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZCh2aWV3cG9ydCk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXNlcyBzdGF0aWMgZGV2aWNlIGVudmlyb25tZW50IHZhcmlhYmxlcyAoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0LCBkZXZpY2VQaXhlbFJhdGlvKSB0byByZWNvZ25pemUgZGV2aWNlIHNwZWMuXHJcbiAgICAgKiBcclxuICAgICAqIEByZXR1cm4ge0FycmF5fSBzcGVjXHJcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IHNwZWNbMF0gd2luZG93LmlubmVyV2lkdGggd2hlbiBkZXZpY2UgaXMgaW4gYSBwb3J0cmFpdCBvcmllbnRhdGlvbiwgc2NhbGUgMC4yNSBhbmQgcGFnZSBpcyB0aGUgbWluaW1hbCB2aWV3XHJcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IHNwZWNbMV0gd2luZG93LmlubmVySGVpZ2h0IHdoZW4gZGV2aWNlIGlzIGluIGEgcG9ydHJhaXQgb3JpZW50YXRpb24sIHNjYWxlIDAuMjUgYW5kIHBhZ2UgaXMgdGhlIG1pbmltYWwgdmlld1xyXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBzcGVjWzJdIHdpbmRvdy5pbm5lcldpZHRoIHdoZW4gZGV2aWNlIGlzIGluIGEgbGFuZHNjYXBlIG9yaWVudGF0aW9uLCBzY2FsZSAwLjI1IGFuZCBwYWdlIGlzIHRoZSBtaW5pbWFsIHZpZXdcclxuICAgICAqIEByZXR1cm4ge051bWJlcn0gc3BlY1szXSB3aW5kb3cuaW5uZXJIZWlnaHQgd2hlbiBkZXZpY2UgaXMgaW4gYSBsYW5kc2NhcGUgb3JpZW50YXRpb24sIHNjYWxlIDAuMjUgYW5kIHBhZ2UgaXMgdGhlIG1pbmltYWwgdmlld1xyXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBzcGVjWzRdIHNjcmVlbi53aWR0aFxyXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBzcGVjWzVdIHNjcmVlbi5oZWlnaHRcclxuICAgICAqIEByZXR1cm4ge051bWJlcn0gc3BlY1s2XSBkZXZpY2VQaXhlbFJhdGlvXHJcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IHNwZWNbN10gbmFtZVxyXG4gICAgICovXHJcbiAgICBzY3JlYW0uX2RldmljZVNwZWMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHNwZWNzLFxyXG4gICAgICAgICAgICBzcGVjLFxyXG4gICAgICAgICAgICBpO1xyXG5cclxuICAgICAgICBzcGVjcyA9IFtcclxuICAgICAgICAgICAgWzEyODAsIDE3NjIsIDE5MjAsIDEyODAsIDMyMCwgNDgwLCAyLCAnaVBob25lIDQnXSxcclxuICAgICAgICAgICAgWzEyODAsIDIxMTQsIDIyNzIsIDEyODAsIDMyMCwgNTY4LCAyLCAnaVBob25lIDUgb3IgNXMnXSxcclxuICAgICAgICAgICAgWzE1MDAsIDI1MTAsIDI2NjgsIDE1MDAsIDM3NSwgNjY3LCAyLCAnaVBob25lIDYnXSxcclxuICAgICAgICAgICAgWzE2NTYsIDI3ODUsIDI5NDQsIDE2NTYsIDQxNCwgNzM2LCAzLCAnaVBob25lIDYgcGx1cyddLFxyXG5cdFx0XHRbMTUwMCwgMjUwOSwgMjY2OCwgMTUwMCwgMzc1LCA2NjcsIDMsICdpUGhvbmUgNiBwbHVzIChab29tZWQpJ10sXHJcbiAgICAgICAgICAgIFszMDcyLCAzOTM2LCA0MDk2LCAyOTEyLCA3NjgsIDEwMjQsIDEsICdpUGFkIDInXSxcclxuICAgICAgICAgICAgWzMwNzIsIDM5MzgsIDQwOTYsIDI5MTQsIDc2OCwgMTAyNCwgMiwgJ2lQYWQgQWlyIG9yIFJldGluYSddXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgaSA9IHNwZWNzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICBpZiAoZ2xvYmFsLnNjcmVlbi53aWR0aCA9PT0gc3BlY3NbaV1bNF0gJiZcclxuICAgICAgICAgICAgICAgIGdsb2JhbC5zY3JlZW4uaGVpZ2h0ID09PSBzcGVjc1tpXVs1XSAmJlxyXG4gICAgICAgICAgICAgICAgZ2xvYmFsLmRldmljZVBpeGVsUmF0aW8gPT09IHNwZWNzW2ldWzZdKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgc3BlYyA9IHNwZWNzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cdFx0XHJcblx0XHRpZiAoIXNwZWMpIHtcclxuICAgICAgICAgIHNwZWMgPSBbKGdsb2JhbC5zY3JlZW4ud2lkdGggKiA0KSwgKGdsb2JhbC5zY3JlZW4uaGVpZ2h0ICogNCAtIDM5LjUpLCAoZ2xvYmFsLnNjcmVlbi5oZWlnaHQgKiA0KSwgKGdsb2JhbC5zY3JlZW4ud2lkdGggKiA0KSwgZ2xvYmFsLmRldmljZVBpeGVsUmF0aW8sICdDcmF6eSBpUGhvbmUnXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzcGVjO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBoZWlnaHQgb2YgdGhlIHVzYWJsZSB2aWV3cG9ydCBpbiB0aGUgbWluaW1hbCB2aWV3IHJlbGF0aXZlIHRvIHRoZSBjdXJyZW50IHZpZXdwb3J0IHdpZHRoLlxyXG4gICAgICogXHJcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIHdvcmsgd2l0aCBpT1M4IG9ubHkuXHJcbiAgICAgKiBcclxuICAgICAqIEBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNjgyNzgyMi9ob3ctaXMtdGhlLXdpbmRvdy1pbm5lcmhlaWdodC1kZXJpdmVkLW9mLXRoZS1taW5pbWFsLXZpZXcvMjY4Mjc4NDJcclxuICAgICAqIEBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNjgwMTk0My9ob3ctdG8tZ2V0LXRoZS13aW5kb3ctc2l6ZS1vZi1mdWxsc2NyZWFtLXZpZXctd2hlbi1ub3QtaW4tZnVsbHNjcmVhbVxyXG4gICAgICogQHJldHVybiB7TnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBzY3JlYW0uX2dldE1pbmltYWxWaWV3SGVpZ2h0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBzcGVjLFxyXG4gICAgICAgICAgICBoZWlnaHQsXHJcbiAgICAgICAgICAgIG9yaWVudGF0aW9uID0gc2NyZWFtLmdldE9yaWVudGF0aW9uKCk7XHJcblxyXG4gICAgICAgIHNwZWMgPSBzY3JlYW0uX2RldmljZVNwZWMoKTtcclxuXHJcbiAgICAgICAgaWYgKCFzcGVjKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm90IGEga25vd24gaU9TIGRldmljZS4gSWYgeW91IGFyZSB1c2luZyBhbiBpT1MgZGV2aWNlLCByZXBvcnQgaXQgdG8gaHR0cHM6Ly9naXRodWIuY29tL2dhanVzL3NjcmVhbS9pc3N1ZXMvMS4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvcmllbnRhdGlvbiA9PT0gJ3BvcnRyYWl0Jykge1xyXG4gICAgICAgICAgICBoZWlnaHQgPSBNYXRoLnJvdW5kKChzY3JlYW0uZ2V0Vmlld3BvcnRXaWR0aCgpICogc3BlY1sxXSkgLyBzcGVjWzBdKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBoZWlnaHQgPSBNYXRoLnJvdW5kKChzY3JlYW0uZ2V0Vmlld3BvcnRXaWR0aCgpICogc3BlY1szXSkgLyBzcGVjWzJdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBoZWlnaHQ7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBkaW1lbnNpb25zIG9mIHRoZSB1c2FibGUgdmlld3BvcnQgaW4gdGhlIG1pbmltYWwgdmlldyByZWxhdGl2ZSB0byB0aGUgY3VycmVudCB2aWV3cG9ydCB3aWR0aCBhbmQgb3JpZW50YXRpb24uXHJcbiAgICAgKiBcclxuICAgICAqIEByZXR1cm4ge09iamVjdH0gZGltZW5zaW9uc1xyXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBkaW1lbnNpb25zLndpZHRoXHJcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IGRpbWVuc2lvbnMuaGVpZ2h0XHJcbiAgICAgKi9cclxuICAgIHNjcmVhbS5nZXRNaW5pbWFsVmlld1NpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHdpZHRoID0gc2NyZWFtLmdldFZpZXdwb3J0V2lkdGgoKSxcclxuICAgICAgICAgICAgaGVpZ2h0ID0gc2NyZWFtLl9nZXRNaW5pbWFsVmlld0hlaWdodCgpO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXHJcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgc2NyZWVuIGlzIGluIFwibWluaW1hbFwiIFVJLlxyXG4gICAgICpcclxuICAgICAqIGlPUyA4IGhhcyByZW1vdmVkIHRoZSBtaW5pbWFsLXVpIHZpZXdwb3J0IHByb3BlcnR5LlxyXG4gICAgICogTmV2ZXJ0aGVsZXNzLCB1c2VyIGNhbiBlbnRlciBtaW5pbWFsLXVpIHVzaW5nIHRvdWNoLWRyYWctZG93biBnZXN0dXJlLlxyXG4gICAgICogVGhpcyBtZXRob2QgaXMgdXNlZCB0byBkZXRlY3QgaWYgdXNlciBpcyBpbiBtaW5pbWFsLXVpIHZpZXcuXHJcbiAgICAgKlxyXG4gICAgICogSW4gY2FzZSBvZiBvcmllbnRhdGlvbiBjaGFuZ2UsIHRoZSBzdGF0ZSBvZiB0aGUgdmlldyBjYW4gYmUgYWNjdXJhdGVseVxyXG4gICAgICogZGV0ZXJtaW5lZCBvbmx5IGFmdGVyIG9yaWVudGF0aW9uY2hhbmdlZW5kIGV2ZW50LlxyXG4gICAgICogXHJcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxyXG4gICAgICovXHJcbiAgICBzY3JlYW0uaXNNaW5pbWFsVmlldyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBJdCBpcyBlbm91Z2ggdG8gY2hlY2sgdGhlIGhlaWdodCwgYmVjYXVzZSB0aGUgdmlld3BvcnQgaXMgYmFzZWQgb24gd2lkdGguXHJcbiAgICAgICAgcmV0dXJuIGdsb2JhbC5pbm5lckhlaWdodCA9PSBzY3JlYW0uZ2V0TWluaW1hbFZpZXdTaXplKCkuaGVpZ2h0O1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIERldGVjdCB3aGVuIHZpZXcgY2hhbmdlcyBmcm9tIGZ1bGwgdG8gbWluaW1hbCBhbmQgdmljZS12ZXJzYS5cclxuICAgICAqL1xyXG4gICAgc2NyZWFtLl9kZXRlY3RWaWV3Q2hhbmdlID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgbGFzdFZpZXc7XHJcblxyXG4gICAgICAgIC8vIFRoaXMgbWV0aG9kIHdpbGwgb25seSB3aXRoIGlPUyA4LlxyXG4gICAgICAgIC8vIE92ZXJ3cml0ZSB0aGUgZXZlbnQgaGFuZGxlciB0byBwcmV2ZW50IGFuIGVycm9yLlxyXG4gICAgICAgIGlmICghc2NyZWFtLl9kZXZpY2VTcGVjKCkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1ZpZXcgY2hhbmdlIGRldGVjdGlvbiBoYXMgYmVlbiBkaXNhYmxlZC4gVW5yZWNvZ25pemVkIGRldmljZS4gSWYgeW91IGFyZSB1c2luZyBhbiBpT1MgZGV2aWNlLCByZXBvcnQgaXQgdG8gaHR0cHM6Ly9naXRodWIuY29tL2dhanVzL3NjcmVhbS9pc3N1ZXMvMS4nKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7fTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50VmlldyA9IHNjcmVhbS5pc01pbmltYWxWaWV3KCkgPyAnbWluaW1hbCcgOiAnZnVsbCc7XHJcblxyXG4gICAgICAgICAgICBpZiAobGFzdFZpZXcgIT0gY3VycmVudFZpZXcpIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50RW1pdHRlci50cmlnZ2VyKCd2aWV3Y2hhbmdlJywge1xyXG4gICAgICAgICAgICAgICAgICAgIHZpZXdOYW1lOiBjdXJyZW50Vmlld1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGFzdFZpZXcgPSBjdXJyZW50VmlldztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0gKCkpO1xyXG5cclxuICAgIHNjcmVhbS5fc2V0dXBET01FdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgaXNPcmllbnRhdGlvbkNoYW5naW5nO1xyXG5cclxuICAgICAgICAvLyBNZWRpYSBtYXRjaGVyIGlzIHRoZSBmaXJzdCB0byBwaWNrIHVwIHRoZSBvcmllbnRhdGlvbiBjaGFuZ2UuXHJcbiAgICAgICAgZ2xvYmFsXHJcbiAgICAgICAgICAgIC5tYXRjaE1lZGlhKCcob3JpZW50YXRpb246IHBvcnRyYWl0KScpXHJcbiAgICAgICAgICAgIC5hZGRMaXN0ZW5lcihmdW5jdGlvbiAobSkge1xyXG4gICAgICAgICAgICAgICAgaXNPcmllbnRhdGlvbkNoYW5naW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIE9DRS5vbignb3JpZW50YXRpb25jaGFuZ2VlbmQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlzT3JpZW50YXRpb25DaGFuZ2luZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgc2NyZWFtLl91cGRhdGVWaWV3cG9ydCgpO1xyXG4gICAgICAgICAgICBzY3JlYW0uX2RldGVjdFZpZXdDaGFuZ2UoKTtcclxuXHJcbiAgICAgICAgICAgIGV2ZW50RW1pdHRlci50cmlnZ2VyKCdvcmllbnRhdGlvbmNoYW5nZWVuZCcpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcignb3JpZW50YXRpb25jaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHNjcmVhbS5fdXBkYXRlVmlld3BvcnQoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCFpc09yaWVudGF0aW9uQ2hhbmdpbmcpIHtcclxuICAgICAgICAgICAgICAgIHNjcmVhbS5fZGV0ZWN0Vmlld0NoYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIGlQaG9uZSA2IHBsdXMgZG9lcyBub3QgdHJpZ2dlciByZXNpemUgZXZlbnQgd2hlbiBsZWF2aW5nIHRoZSBtaW5pbWFsLXVpIGluIHRoZSBsYW5kc2NhcGUgb3JpZW50YXRpb24uXHJcbiAgICAgICAgZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCFpc09yaWVudGF0aW9uQ2hhbmdpbmcpIHtcclxuICAgICAgICAgICAgICAgIHNjcmVhbS5fZGV0ZWN0Vmlld0NoYW5nZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBzY3JlYW0uX2RldGVjdFZpZXdDaGFuZ2UoKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgc2NyZWFtLl91cGRhdGVWaWV3cG9ydCgpO1xyXG4gICAgc2NyZWFtLl9zZXR1cERPTUV2ZW50TGlzdGVuZXJzKCk7XHJcblxyXG4gICAgc2NyZWFtLm9uID0gZXZlbnRFbWl0dGVyLm9uO1xyXG59O1xyXG5cclxuZ2xvYmFsLmdhanVzID0gZ2xvYmFsLmdhanVzIHx8IHt9O1xyXG5nbG9iYWwuZ2FqdXMuU2NyZWFtID0gU2NyZWFtO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTY3JlYW07XG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSJdfQ==
