(function() {
    'use strict';

    var assert = chai.assert;

    it('Should be defined as a jQuery object', function() {
      assert($(document.body).tact);
    });

    it('Should bind listeners properly', function() {
      var evtObj,
          noopCb;

      // Noop functions
      noopCb = function() {
        return true;
      };

      $('body').tact({
        'drag': noopCb,
        'swipe': noopCb
      });

      evtObj = $._data($('body').get(0), 'events');

      assert(evtObj['tact:drag'].length > 0);
      assert(evtObj['tact:swipe'].length > 0);
    });

    it('Should disable listeners properly', function() {
        var settingsObj;

        $('body').tact('disable');

        settingsObj = $('body').data('__TACTILE');

        assert(settingsObj.settings.enabled === 0);
      });

    it('Should enable listeners properly', function() {
        var settingsObj;

        $('body').tact('enable');

        settingsObj = $('body').data('__TACTILE');

        assert(settingsObj.settings.enabled === 1);
      });

    it('Should destroy listeners properly', function() {
        var settingsObj;

        $('body').tact('destroy');

        settingsObj = $('body').data('__TACTILE');

        assert(settingsObj === undefined);
      });
})();