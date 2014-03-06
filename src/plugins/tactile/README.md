#jquery.tactile.js

---


##Features
* Light weight (*<2KB gzipped*)
* Easily bind callbacks for `swipe`, `drag`, and `tap`

##Requirements
jquery.tactile.js has the following requirements:

* jQuery (1.7 or greater)

##Usage

    $('.selector').tact({
        'swipe': function(e){ alert('swiped!') },
        'drag': function(e){ console.log('dragging!') }
    })

Tact provides the following gesture events:

1. **swipe**
The `swipe` event is based on the velocity of a drag. The event is triggered in `touchend`, prior to tact's `dragend` event.

2. **dragstart**
The `dragstart` event is triggered after a user has touched the element and moved greater than the threshold (minimum of 10px), without lifting their finger/input. Currently, vertical dragging is not supported. The event is called within `touchmove`.

3. **drag**
The `drag` event is triggered after `dragstart`, in subsequent `touchmove` events.

4. **dragend**
The `dragend` event is triggered at the end of a touch event (in `touchend`). It is triggered after the `swipe` event.

5. **tap**
The `tap` event allows elements to be "tapped" on, avoiding the 300ms delay (if present) on touch devices.


During the callback, the original `touchevent` object is passed. Tactile extends the event object to include a `gesture` object. The `gesture` object shares the following properties across gestures:

     e.gesture.type (string, event type, e.g. drag, swipe, tap)
     e.gesture.id (number, the touch ID)
     e.gesture.start (number, touch event start time)

The following property is specific to drag/swipe:

    e.gesture.dir (number, -1 or 1)
    e.gesture.delta.x (number, the difference between the starting 'x' point and current point)
    e.gesture.delta.y (number, the difference between the starting 'y' point and current point)
    e.gesture.swipe (boolean, whether a swipe occurred based on velocity)

Finally, jquery.tactile.js accepts the following string arguments:

    $('.selector').tact('disable'); // Disables tactile.js from triggering touch-events for the element
    $('.selector').tact('enable'); // Enables tactile.js to trigger touch-events for element
    $('.selector').tact('destroy'); // Removes touch handlers on element, destroys tact-related data

##Author
[Jack Pattishall](http://www.linkedin.com/in/jackpattishall)


