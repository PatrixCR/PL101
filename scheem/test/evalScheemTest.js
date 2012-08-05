if (typeof module !== 'undefined') {
    // In Node.js load required modules
    var assert = require('chai').assert;
    var expect = require('chai').expect;
    var PEG = require('pegjs');
    var fs = require('fs');
    var evalScheem = require('../scheem').evalScheem;
    var evalScheemString = require('../scheem').evalScheemString;
    var parse = PEG.buildParser(fs.readFileSync(
        'scheem.peg', 'utf-8')).parse;
} else {
    // In browser assume loaded by <script>
    var parse = SCHEEM.parse;
    var assert = chai.assert;
    var expect = chai.expect;
}

suite('arithmetic', function() {
    test('add', function() {
        assert.deepEqual(
            evalScheem(['+', 1, ['+', 1, 2]], {}),
            4
        );
    });
    test('substraction', function() {
        assert.deepEqual(
            evalScheem(['-', 10, ['-', 8, 2]], {}),
            4
        );
    });
    test('multiplication', function() {
        assert.deepEqual(
            evalScheem(['*', 1, ['*', 4, 8]], {}),
            32
        );
    });
    test('division', function() {
        assert.deepEqual(
            evalScheem(['/', 40, ['/', 20, 10]], {}),
            20
        );
    });
});

suite('environment', function() {
    test('define', function() {
        var env = { bindings: {}, outer: {bindings: {x: 3}, outer: {}}};
        evalScheem(['define', 'x', 5], env);
        assert.deepEqual(
            env, {bindings: {x: 5}, outer: {bindings: {x: 3}, outer: {}}}
        );
    });
    test('define on empty env', function() {
        var env = {};
        evalScheem(['define', 'x', 5], env);
        assert.deepEqual(
            env, {bindings: {x: 5}, outer: {}}
        );
    });
    // test('let-one', function() {
    //     var env = {};
    //     var result = evalScheem(['let-one', 'x', 5, ['+', ['let-one', 'x', 4, 'x'], ['let-one', 'y', 7, 'x']]], env);
    //     assert.deepEqual(
    //         result, 9
    //     );
    // });
    test('let', function() {
        var env = {};
        var result = evalScheem(['let', [['x', 5], ['y', 4]], ['+', ['let', [['x', 3]], 'y'], ['let', [['y', 7]], 'x']]], env);
        assert.deepEqual(
            result, 9
        );
    });
    test('set!', function() {
        var env = {bindings: {a: 4}, outer: {bindings: {x: 3}, outer: {}}};
        evalScheem(['set!', 'x', 5], env);
        assert.deepEqual(
            env, {bindings: {a: 4}, outer: {bindings: {x: 5}, outer: {}}}
        );
    });
    test('set! on empty env', function() {
        var env = {};
        expect(function () {
            evalScheem(['set!', 'x', 5], env);
        }).to.throw();
    });
    test('set! on undefined variable', function() {
        var env = {bindings: {a: 4}, outer: {bindings: {x: 3}, outer: {}}};
        expect(function () {
            evalScheem(['set!', 'y', 5], env);
        }).to.throw();
    });
});

suite('quote', function() {
    test('a list', function() {
        assert.deepEqual(
            evalScheem(['quote', ['+', 3, 2]], {}),
            ['+', 3, 2]
        );
    });
});

suite('comparison operator', function() {
    test('equal', function() {
        assert.deepEqual(
            evalScheem(['=', 5, ['+', 3, 2]], {}),
            '#t'
        );
    });
    test('less than', function() {
        assert.deepEqual(
            evalScheem(['<', 5, ['*', 3, 2]], {}),
            '#t'
        );
    });
    test('if', function() {
        assert.deepEqual(
            evalScheem(['if', ['=', 'x', 5], 1, 0], {bindings: {x: 5}, outer: {}}),
            1
        );
    });
});

suite('list manipulation', function() {
    test('cons', function() {
        assert.deepEqual(
            evalScheem(['cons', ['quote', [12, 3]], ['quote', [3, 2]]], {}),
            [[12, 3], 3, 2]
        );
    });
    test('car', function() {
        assert.deepEqual(
            evalScheem(['car', ['quote', [1, 3, 2]]], {}),
            1
        );
    });
    test('cdr', function() {
        assert.deepEqual(
            evalScheem(['cdr', ['quote', [1, 3, 2]]], {}),
            [3, 2]
        );
    });
});

suite('expression sequence', function() {
    test('begin', function() {
        assert.deepEqual(
            evalScheem(['begin', ['define', 'x', 5], ['define', 'y', ['*', 'x', 2]], ['if', ['=', 'y', [
              '*', 'x', 2]], 1, 0]], {}),
            1
        );
    });
});

suite('function', function() {
    var env = {
        bindings: {
            factorial: function (x) {
                if (x === 1 || x === 0) return 1;
                return x * env.bindings.factorial(x-1);
            },
            addAll: function () {
                var res = 0;
                for (var i = arguments.length - 1; i >= 0; i--) {
                    res += arguments[i];
                };
                return res;
            },
            v: 9
        },
        outer: {}
    };
    test('application on 1 arg', function() {
        assert.deepEqual(
            evalScheem(['factorial', ['+', 2, 3]], env),
            120
        );
    });
    test('application on multiple args', function() {
        assert.deepEqual(
            evalScheem(['addAll', ['+', 2, 3], ['*', 3, 3], 1, 15], env),
            30
        );
    });
    // test('using lambda-one', function() {
    //     evalScheem(['define', 'times3', ['lambda-one', 'x', ['*', 'x', 3]]], env);
    //     assert.deepEqual(
    //         evalScheem(['times3', 700], env),
    //         2100
    //     );
    // });
    test('using lambda - simple', function() {
        evalScheem(['define', 'consecutiveMul', ['lambda', ['x', 'y', 'z'], ['*', 'x', ['*', 'y', 'z']]]], env);
        assert.deepEqual(
            evalScheem(['consecutiveMul', 3, 7, 4], env),
            84
        );
    });
    test('using lambda - passing a function', function() {
        var fn = evalScheem(['lambda', ['x', 'y', 'z'], ['*', 'x', ['*', 'y', 'z']]], env);
        assert.deepEqual(
            fn('v', 2, ['addAll', 1, 1, 1, 1]),
            72
        );
    });
    test('using lambda - modify global var', function() {
        evalScheem(['begin', ['define', 'modGlob', ['lambda', ['x'], ['set!', 'v', 'x']]], ['modGlob', 1533]], env);
        assert.deepEqual(
            evalScheem('v', env),
            1533
        );
    });
    test('using lambda - return inner func', function() {
        evalScheem(['begin', 
            ['define', 'mulBy', ['lambda', ['x'], ['lambda', ['y'], ['*', 'x', 'y']]]],
            ['define', 'mulBy5', ['mulBy', 5]]], env);
        assert.deepEqual(
            evalScheem(['mulBy5', 40], env),
            200
        );
    });
    test('using lambda - define itself recursively', function() {
        evalScheem(['define', 'cascSum', 
            ['lambda', ['x'], ['if', ['<', 'x', 1], 0, ['+', 'x', ['cascSum', ['-', 'x', 1]]]]]], env);
        assert.deepEqual(
            evalScheem(['cascSum', 10], env),
            55
        );
    });
});

suite('parse', function() {
    test('a number', function() {
        assert.deepEqual(
            parse('42'),
            42
        );
    });
    test('a variable', function() {
        assert.deepEqual(
            parse('x'),
            'x'
        );
    });
    test('sequence with quote and comments', function() {
        assert.deepEqual(
            parse(";;scheem program\n;;testing comments..\n'(+ 1 2 3);;this should be ignored"),
            ["quote", ["+", 1, 2, 3]]
        );
    });
});

suite('interpret', function() {
    test('parse then eval', function() {
        assert.deepEqual(
            evalScheemString("(begin (define x 5) (define y (* x 2)) (if (= y (* x 2)) 1 0))", parse, {}),
            1
        );
    });
});