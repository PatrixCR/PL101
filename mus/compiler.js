var endTime = function (time, expr) {
    if (expr.tag === 'note' || expr.tag === 'rest') return time + expr.dur;
    if (expr.tag === 'par') {
        var etL = endTime(time, expr.left), etR = endTime(time, expr.right);
        return (etL >= etR) ? etL : etR;
    }
    if (expr.tag === 'repeat') return time + expr.count * expr.section.dur;
    return endTime(time, expr.left) + endTime(time, expr.right);
};

var convertPitch = function (pitch) {
    var n = { 'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11,};
    return 12 + 12 * pitch[1] + n[pitch[0]];
}

var compileT = function (t, musexpr) {
    if (musexpr.tag === 'note' || musexpr.tag === 'rest') {      
        musexpr.start = t;
        musexpr.pitch = convertPitch(musexpr.pitch);
        return [musexpr];
    }
    if (musexpr.tag === 'par') return []
        .concat(arguments.callee(t, musexpr.left))
        .concat(arguments.callee(t, musexpr.right));
    if (musexpr.tag === 'repeat') {
        var noteArray = [{
                tag: 'note', pitch: convertPitch(musexpr.section.pitch), 
                start: t, dur: musexpr.section.dur
            }];
        for (var i = 1; i < musexpr.count; i++) {
            var noteexpr = {
                tag: 'note', pitch: convertPitch(musexpr.section.pitch), 
                //start: endTime(t + i * musexpr.section.dur, musexpr), 
                dur: musexpr.section.dur
            };
            noteexpr.start = endTime(t + (i - 1) 
                                       * musexpr.section.dur, noteexpr);
            noteArray.push(noteexpr);    
        }
        return noteArray;
    }
    return [].concat(arguments.callee(t, musexpr.left))
             .concat(arguments.callee(endTime(t, musexpr.left), musexpr.right));
};

var compile = function (musexpr) {
    // your code here
    return compileT(0, musexpr);
};

var melody_mus = 
    { tag: 'seq',
      left: 
       { tag: 'seq',
         left: { tag: 'note', pitch: 'a4', dur: 250 },
         right: { tag: 'note', pitch: 'b4', dur: 250 } },
      right:
       { tag: 'seq',
         left: { tag: 'repeat', section: { tag: 'note', pitch: 'c4', dur: 250 }, count: 3 },
         right: { tag: 'note', pitch: 'd4', dur: 500 } } };

console.log(melody_mus);
console.log(compile(melody_mus));