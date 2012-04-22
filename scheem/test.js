var PEG = require('pegjs');
var assert = require('assert');
var fs = require('fs'); // for loading files

fs.readFile('scheem.peg', 'ascii', function(err, data) {
    // Show the PEG grammar file
    console.log(data);
    // Create my parser
    var parse = PEG.buildParser(data).parse;
    // Do a test
    assert.deepEqual( parse("5"), "5" );
    assert.deepEqual( parse("(a (+ 1 2 3) (- 43 15))"), ["a", ["+", "1", "2", "3"], ["-", "43", "15"]] );
    assert.deepEqual( parse("(\n\t a b c)"), ["a", "b", "c"] );    
    assert.deepEqual( parse("'(a b c)"), ["quote", ["a", "b", "c"]] );
     assert.deepEqual( parse(";;scheem program\n;;testing comments..\n(a b c)\n\n\n;;this should be ignored"), ["a", "b", "c"] );
});