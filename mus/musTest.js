var PEG = require('pegjs');
var assert = require('assert');
var fs = require('fs'); // for loading files

fs.readFile('mus.peg', 'ascii', function(err, data) {
    // Show the PEG grammar file
    console.log(data);
    // Create my parser
    var parse = PEG.buildParser(data).parse;
    // Do a test
    assert.deepEqual( parse("a4:500"), {tag: 'note', pitch: 'a4', dur: 500} );
    assert.deepEqual( parse(".:500"), {tag: 'rest', dur: 500} );
    assert.deepEqual( parse("|a4:300 a3:250 a2:300|"), 
        { tag: "par", left: {tag: "note", pitch: "a4", dur: 300},
                      "right": {"tag": "par",
                                "left": {"tag": "note",
                                         "pitch": "a3",
                                         "dur": 250},
                                "right": {"tag": "note",
                                          "pitch": "a2",
                                          "dur": 300}
                                }
        } );
    assert.deepEqual( parse("-test\n(a4:300 .:250 |a4:300 a2:500|)*2-test\n-test\n-test"), 
        {
           "tag": "repeat",
           "section": {
              "tag": "seq",
              "left": {
                 "tag": "note",
                 "pitch": "a4",
                 "dur": 300
              },
              "right": {
                 "tag": "seq",
                 "left": {
                    "tag": "rest",
                    "dur": 250
                 },
                 "right": {
                    "tag": "par",
                    "left": {
                       "tag": "note",
                       "pitch": "a4",
                       "dur": 300
                    },
                    "right": {
                       "tag": "note",
                       "pitch": "a2",
                       "dur": 500
                    }
                 }
              }
           },
           "count": 2
        } );
});