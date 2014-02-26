/**
 * tactile.js
 * @author Jack Pattishall
 *
 * Current touch events supported are: tap, drag (including dragstart, dragend), swipe
 *
 * Usage:
 * $(SELECTOR).tact({
 *     dragstart: function(e){ .. },
 *     drag: function(e){ .. },
 *     dragend: function(e){ .. },
 *     swipe: function(e){ .. },
 *     tap: function(e){ .. },
 * });
 *
 * The event object passed to the callback(s) will include a gesture object
 * with the following properties:
 *
 * Shared properties
 * - e.gesture.type (event type, e.g. drag, swipe, tap)
 * - e.gesture.id (touch ID)
 * - e.gesture.start (touch event start time)
 *
 * Drag/swipe specific
 * - e.gesture.dir (direction, left and right, expressed in numerical values (l:1, r: -1))
 *
 * To enable, disable, or destroy the plugin, call the following methods:
 * $(SELECTOR).tact('disable');
 * $(SELECTOR).tact('enable');
 * $(SELECTOR).tact('destroy');
 */

// TODO: Add support for IE Pointer Events
(function($) {
    'use strict';

    // CONST
    var DATATACT = '__TACTILE',
        TACT_LISTENER_IS_BOUND = '__TACTILE_LISTENER_BOUND',

        // Minimum number of pixels a user moves before dragging starts
        DRAG_THRESHOLD = 10,

        // Maximum duration between touchstart and touchend to determine tap
        TAP_THRESHOLD = 150,

        // Maximum number of pixels a user can move between taps
        TAP_DISTANCE = 10,

        // Slope to determine if user is swiping
        SLOPE = 0.5,

        // Velocity of finger movement to determine user swiping
        VELOCITY = 0.5,

        EVENTS = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];

    /**
     * Our object of touch handlers
     */
    var _touchHandlers = {

            /**
             * TouchStart
             * @param {Touch Event} e
             */
            touchstart: function(e) {
                var s = this.settings,
                    t = e.changedTouches[0];

                // Reset touch related variables
                s.dY = 0;
                s.dX = 0;
                s.scroll = 0;
                s.dir = 0;

                s.userDragging = false;

                // Set initial touch properties
                s.sX = Math.abs(t.screenX);
                s.sY = Math.abs(t.screenY);
                s.sT = new Date().getTime();

                s.id = t.identifier;
            },

            /**
             * TouchMove
             * @param {Touch Event} e
             */
            touchmove: function(e) {
                var $el = this.$el,
                    s = this.settings,
                    t = e.changedTouches[0];

                // Ignore scrolling
                if (s.scroll) {
                    return;
                }

                // Set direction
                s.dir = s.dX >= (t.screenX - s.sX) ? -1 : 1;

                // Update points
                s.dX = t.screenX - s.sX;
                s.dY = t.screenY - s.sY;

                // Is scroll intended?
                if (!s.userDragging && (Math.abs(s.dY / s.dX) > SLOPE)) {
                    s.scroll = 1;
                    return;
                }

                // Handle drag callbacks
                if (s.userDragging || (s.listenDrag && (Math.abs(s.dY) > DRAG_THRESHOLD || Math.abs(s.dX) >= DRAG_THRESHOLD))) {
                    e.gesture = this._extendGestureObj(s);
                    e.preventDefault();


                    if (!s.userDragging) {
                        s.sX = t.screenX;
                        s.sY = t.screenY;

                        e.gesture = this._extendGestureObj(s);
                        e.gesture.type = 'dragstart';
                        $el.trigger('tact:dragstart', e);
                        s.userDragging = true;
                    } else {
                        e.gesture.type = 'drag';
                        $el.trigger('tact:drag', e);
                    }
                }
            },

            /**
             * TouchEnd
             * @param {Touch Event} e
             */
            touchend: function(e) {
                var $el = this.$el,
                    s = this.settings,
                    t = e.changedTouches[0],
                    d = new Date().getTime(),
                    pX = Math.abs(t.screenX),
                    pY = Math.abs(t.screenY),
                    swipeTriggered = false,
                    diffT,
                    diffP;

                diffT = d - s.sT;

                // Delta between start/end points
                diffP = Math.floor(Math.sqrt(((pX - s.sX) * (pX - s.sX) + (pY - s.sY) * (pY - s.sY))));

                e.gesture = this._extendGestureObj(s);

                e.gesture.end = d;
                e.gesture.duration = diffT;

                // Determine if user swiped, and handle callback
                if ((Math.abs(s.sX - pX) / Math.abs(s.sT - d)) > VELOCITY) {
                    e.gesture.velocity = (Math.abs(s.sX - pX) / Math.abs(s.sT - d));
                    e.gesture.type = 'swipe';
                    swipeTriggered = true;
                    $el.trigger('tact:swipe', e);
                }

                // Determine if user dragged, and handle callback
                if (s.userDragging) {
                    s.userDragging = false;
                    e.gesture.type = 'dragend';
                    e.gesture.swipe = swipeTriggered;
                    $el.trigger('tact:dragend', e);
                }

                // Determine if user tapped, and handle callback
                if (TAP_THRESHOLD > diffT && TAP_DISTANCE > diffP) {
                    delete e.gesture.dir;
                    delete e.gesture.delta;

                    e.gesture.type = 'tap';
                    $el.trigger('tact:tap', e);
                }
            },

            /**
             * TouchCancel
             * @param {Touch Event} e
             *
            */
            touchcancel: function(e) {
                // Call touchend
                this.handlers.touchend(e);
                //this.touchend(e);
            }
        };

    /**
     * Returns touch handler (touchstart, touchmove, touchend, touchcancel) to bind to el
     * @param {String} evtType
     * @param {Object} ctx
     */
    var _createTouchEvtHandler = function _createTouchEvtHandler(action, ctx, evtType) {
        var $el = ctx.$el,
            hasListener = $el.data(TACT_LISTENER_IS_BOUND),
            touchHandlerFunc;

        if (action === 1 && (hasListener === undefined || hasListener === false)) {
            touchHandlerFunc = function(e) {
                _touchHandlers[evtType].call(ctx, e);
            };
            ctx.handlers[evtType] = touchHandlerFunc;
        } else {
            touchHandlerFunc = ctx.handlers[evtType];
        }

        return touchHandlerFunc;
    };

    /**
     * Returns Tact Handler to bind to el for triggering touch events
     * @param {String} cb
     * @param {Object} map
     * @param {Object} ctx
     */
    var _createTactHandler = function _createTactHandler(cb, map, ctx) {
        return function(triggerEvt, origEvt) {
            if (ctx.settings.enabled) {
                map[cb].call(ctx.$el[0], origEvt);
            }
        };
    };

    /**
     * Binds TouchEvents to element
     * @param {HTML Element} el
     * @param {Key-Value object} callbackMap (Callbacks to be called at end of touch events)
     * @param {Number} binding (1 - Binding, 0 - Unbinding events)
     */
    function Tact(el, callbackMap) {
        this.settings = {};
        this.$el = $(el);
        this.handlers = {};

        if (!document.addEventListener) { return; }

        this._bindEvents(1, callbackMap);
    }

    Tact.prototype._bindEvents = function(binding, callbackMap) {
        var t = this,
            action = binding === 1 ? 'add' : 'remove',
            el = this.$el.get(0),
            cb,
            i,
            len;

        for (i = 0, len = EVENTS.length; i < len; i++) {
            el[action + 'EventListener'](EVENTS[i], _createTouchEvtHandler(binding, this, EVENTS[i]));
        }

        this.$el.data(TACT_LISTENER_IS_BOUND, !!binding);

        if (action === 'add') {
            if (callbackMap) {
                this.settings.enabled = 1;
                for (cb in callbackMap) {
                    if (callbackMap.hasOwnProperty(cb)) {
                        if (typeof callbackMap[cb] === 'function') {
                            this.$el.on('tact:' + cb + '.tact', _createTactHandler(cb, callbackMap, t));
                        }
                        if (cb.indexOf('drag') > -1) {
                            this.settings.listenDrag = true;
                        }
                    }
                }
            }
        }
    };

    /**
     * Returns shared gesture properties across event types
     * @param {Object} settingsObj
     */
    Tact.prototype._extendGestureObj = function(settings) {
        var obj = {};

        obj.dir = settings.dir;
        obj.id = settings.id;
        obj.start = settings.sT;
        obj.delta = {};
        obj.delta.x = settings.dX;
        obj.delta.y = settings.dY;

        return obj;
    };

    // Exposed public method
    $.fn.extend({
        tact: function(callbackMap) {
            // Determine if user is attempting to enable/disable/destroy plugin
            if (typeof callbackMap === 'string' || callbackMap instanceof String) {
                // Enable/Disable
                if (callbackMap === 'enable') {
                    return this.each(function() {
                        var data = $(this).data(DATATACT);
                        if (data && data.settings) {
                            data.settings.enabled = 1;
                        }
                    });
                }
                if (callbackMap === 'disable') {
                    return this.each(function() {
                        var data = $(this).data(DATATACT);
                        if (data && data.settings) {
                            data.settings.enabled = 0;
                        }
                    });
                }
                // Destroy
                if (callbackMap === 'destroy') {
                    return this.each(function() {
                        var data = $(this).data(DATATACT);
                        if (data) {
                            data._bindEvents(0);
                            $(this).off('.tact');
                            $(this).removeData(DATATACT);
                        }
                    });
                }
                return this;
            }

            return this.each(function() {
                var $this = $(this),
                    tact;

                if ($this.data(DATATACT) === undefined) {
                    $this.data(DATATACT, new Tact(this, callbackMap));
                } else {
                    tact = $this.data(DATATACT);
                    tact._bindEvents(1, callbackMap);
                }
            });

        }
    });
}(jQuery));