test("loading as AMD module", function() {
    stop();
    require(['feaxures'], function(Feaxures) {
       ok(Feaxures, 'feaxures loaded');
       start();
    }, function(err) {
        ok(false, 'Error loading the feaxures ocurred');
        start();
    });
});

require(['feaxures'], function(Feaxures) {
    var feaxures = new Feaxures();
    module('all', {
        'setup': function() { feaxures = new Feaxures(); },
        'teardown': function() {}
    });
    /**
     * Test the config() method
     * 1. feaxures.config({some: value}) - sets the configuration option
     * 2. feaxures.config('some') - retrieves a config value
     * 3. feaxures.config('some', 'value') - sets a single config option
     */
    test('feaxures configuration', function() {
        var config = {'option': 'value'};
        deepEqual(feaxures.config(), {}, 'feaxures config is empty by default');

        feaxures.config(config);
        deepEqual(feaxures.config(), config, 'feaxures.config() loaded a configuration object');

        equal(feaxures.config('option'), 'value', 'feaxures.config() returns a single configuration option');

        feaxures.config('option', 'new_value');
        equal(feaxures.config('option'), 'new_value', 'feaxures.config() changes a configuration option');
    });

    test('event callbacks', function() {
        var result = '',
            clbk_A = function() { result = result + 'A';},
            clbk_B = function() { result = result + 'B';};
        feaxures.on('test', clbk_A);
        feaxures.one('test', clbk_B);
        feaxures.trigger('test');
        equal(result, 'AB', 'Both callbacks were executed');
        feaxures.trigger('test');
        equal(result, 'ABA', 'Only one callback was executed');
        feaxures.off('test', clbk_A);
        feaxures.trigger('test');
        equal(result, 'ABA', 'No callback was executed');
    });

    /**
     * Test register() method
     */
    test('features can be registered', function() {
        ok(!feaxures.isRegistered('tabs'), 'tabs feature is not registered');
        feaxures.register('tabs', {});
        ok(feaxures.isRegistered('tabs'), 'tabs feature is now registered');
    });
    
    /**
     * Test load() method
     */
    test('features with missing files are not loaded', function() {
        stop();
        feaxures.register('fake', {
            files: ['js/fake.js'],
            onLoadError: function() {
                ok(true, 'fake feature was not loaded');
                start();
            }
        });
        feaxures.load('fake');
    });
    test('features are loaded', function() {
        stop();
        feaxures.register('real', {
            files: ['js/real.js'],
            onLoad: function() {
                ok(feaxures.isLoaded('real'), 'real feature was loaded');
                start();
            }
        });
        feaxures.load('real');
    });
    test('load callback is executed', function() {
        stop();
        // we don't use the 'real' feature as it is already registered
        // and start() may be triggered somewhere else
        // alternatively we could implement an unregister() method
        feaxures.register('morereal', {
            files: ['js/real.js', 'css!../css/real']
        });
        feaxures.load('morereal', function() {
            ok(true, 'load callback function was executed');
            start();
        });
    });

    test('files are loaded in order', function() {
        stop();
        feaxures.register('complex', {
            files: ['jquery.pd'],
            onLoad: function() {
                ok(true, 'complex feature was loaded');
                start();
            }
        });
        feaxures.load('complex');
    });

    test('"load" event is triggered only once', function(){
        feaxures.called = 0;
        stop();
        feaxures.register('bereal', {
            files: ['js/real.js', 'css!../css/real']
        });
        feaxures.on('load:bereal', function() {
            feaxures.called++;
            equal(1, feaxures.called, 'Load event triggered once');
        });
        feaxures.load('bereal', function() {
            feaxures.load('bereal', function() {
                start();
            }); // load it again
        });
    });

    test ('log method', function() {
        // intercept console.log()
        // first we test that the function is not called
        var oldLog = console.log;
        console.log = function() {
            ok(false, 'log() method was called althoug it should not have been');
        };
        feaxures.log('some message');
        // now we test that it is called
        console.log = function() {
            ok(arguments, 'log() method was called');
        };
        feaxures.config('debug', true);
        feaxures.log('another message');
        
        // reset the debug options so the previous tests don't break
        feaxures.config({'debug': null});
        // return control to console.log
        console.log = oldLog;
    });
    
    test('retrieving dom element feature options', function(){
        deepEqual(feaxures.getFeatureOptionsForElement('true'), {}, '"true" returns an empty object');
        deepEqual(feaxures.getFeatureOptionsForElement(''), {}, 'an empty string returns an empty object');
        equal(feaxures.getFeatureOptionsForElement('false'), false, '"false" returns false (it prevents the feature from being applied)');
        
        deepEqual(feaxures.getFeatureOptionsForElement('var_a=value_a&var_b=value_b'), {'var_a': 'value_a', 'var_b': 'value_b'}, 'a URL query string returns an object');
        deepEqual(feaxures.getFeatureOptionsForElement('var[a]=value_a&var[b]=value_b'), {'var': {'a': 'value_a', 'b': 'value_b'}}, 'a URL query string returns an nested object');
        deepEqual(feaxures.getFeatureOptionsForElement('var_a=true&var_b=false&var_c=12&var_d=1.234'), {'var_a': true, 'var_b': false, 'var_c': 12, 'var_d': 1.234}, 'a URL query string returns an nested object');
        
        deepEqual(feaxures.getFeatureOptionsForElement('{"a": "b"}'), {'a': 'b'}, 'a json string returns an object');
        
        $('#qunit-fixture').append('<script type="text/feaxture" id="fxtObjectTest">{"a": "b"}</script>');
        deepEqual(feaxures.getFeatureOptionsForElement('#fxtObjectTest'), {'a': 'b'}, 'for a domelement ID that contains a json object returns the object');
        
        $('#qunit-fixture').append('<script type="text/feaxture" id="fxtFunctionTest">function(domElement){return {"a": "b"};}</script>');
        deepEqual(feaxures.getFeatureOptionsForElement('#fxtFunctionTest'), {'a': 'b'}, 'for a domelement ID that contains a function return the result of that object');

        $('#qunit-fixture').append('<script type="text/feaxture" id="fxtFunctionToDomTest">function(domElement){return {"html": $(domElement).html()};}</script>');
        $('#qunit-fixture').append('<div id="idElement"><b>content</b></div>');
        deepEqual(feaxures.getFeatureOptionsForElement('#fxtFunctionToDomTest', $('#idElement')[0]), {'html': '<b>content</b>'}, 'when the options is a function executes it on a DOM element (the element for which we get the options)');

    });

    test('attach/apply feature on elements', function(){
        // create element that the feature will be applied to
        $.each(['a', 'b', 'c'], function(index, val) {
            $('#qunit-fixture').append('<div id="real-'+val+'" data-fxr-real="' + ((index % 2 === 0) ? 'true' : 'false') +'"></div>');
        });
        feaxures.register('real', {
            files: ['real'],
            attach: function(element, options) {
                $(element).real();
            }
        });
        feaxures.attach('real', $('[data-fxr-real]'));
        stop();
        setTimeout(function(){
            var attached = 0;
            $('[id^="real-"]:contains(random number)').each(function() {
                if ($(this).data('fxt.real')) {
                    attached++;
                }
            });
            equal(attached, 2, 'Feature attached to 2 elements out of 3 candidates');
            start();
        }, 1000);
    });

    test('feature is not attached if onBeforeAttach() returns false', function() {
        stop();
        // create element that the feature will be applied to
        $.each(['a', 'b', 'c'], function(index, val) {
            $('#qunit-fixture').append('<div id="bareal-'+val+'" data-fxr-bareal="true"></div>');
        });
        feaxures.register('bareal', {
            files: ['real'],
            onBeforeAttach: function(event) {
                if ($(event.target).attr('id') !== 'bareal-a') {
                    event.result = false;
                }
            },
            attach: function(element, options) {
                $(element).real();
            }
        });
        feaxures.attach('bareal', $('[data-fxr-bareal]'));
        setTimeout(function(){
            var attached = 0;
            $('[id^="bareal-"]:contains(random number)').each(function() {
                if ($(this).data('fxt.bareal')) {
                    attached++;
                }
            });
            equal(attached, 1, 'Feature attached to 1 elements out of 3 candidates');
            start();
        }, 100);
    });

    test('onAfterAttach() is called', function(){
        stop();
        // create element that the feature will be applied to
        $.each(['a', 'b', 'c'], function(index, val) {
            $('#qunit-fixture').append('<div id="aareal-'+val+'" data-fxr-aareal="true"></div>');
        });
        feaxures.register('aareal', {
            files: ['real'],
            onAfterAttach: function(event) {
                $(event.target).addClass('after-apply');
            },
            attach: function(element, options) {
                $(element).real();
            }
        });
        feaxures.attach('aareal', $('[data-fxr-aareal]'));
        setTimeout(function(){
            var attached = 0;
            $('[id^="aareal-"]').each(function() {
                if ($(this).hasClass('after-apply')) {
                    attached++;
                }
            });
            equal(attached, 3, 'onAfterAttach() called on all 3 elements');
            start();
        }, 100);
    });

    test('discover features on elements', function(){
        // create element that the feature will be applied to
        $.each(['a', 'b', 'c'], function(index, val) {
            $('#qunit-fixture').append('<div id="morereal-'+val+'" data-fxr-real="' + ((index % 2 === 0) ? 'true' : 'false') +'"></div>');
        });
        feaxures.register('real', {
            files: ['real'],
            attach: function(element, options) {
                $(element).real();
            }
        });
        feaxures.discover('#qunit-fixture');
        stop();
        setTimeout(function(){
            var attached = 0;
            $('[id^="morereal-"]:contains(random number)').each(function() {
                if ($(this).data('fxt.real')) {
                    attached++;
                }
            });
            equal(attached, 2, 'Feature discovered and attached to 2 elements out of 3 candidates');
            start();
        }, 2000);
    });
});
