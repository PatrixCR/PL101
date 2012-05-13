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
        var env = {bindings: {a: 4}, outer: {x: 3}};
        expect(function () {
            evalScheem(['set!', 'x', 5], env);
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