var initialEnv = {
    '+': function() {
        var c = 0;
        for (var i = arguments.length - 1; i >= 0; i--) {
            c += arguments[i]
        }
        return c;
    },
    '-': function() {
        var c = arguments[0];
        for (var i = 1, j = arguments.length; i < j; i++) {
            c -= arguments[i]
        }
        return c;
    },
    '*': function(x,y) {
        var c = arguments[0];
        for (var i = arguments.length - 1; i >= 1; i--) {
            c *= arguments[i]
        }
        return c;
    },
    '/': function(x,y) {
        var c = arguments[0];
        for (var i = 1, j = arguments.length; i < j; i++) {
            c /= arguments[i]
        }
        return c;
    },
    '<': function(x,y) {
        if (x < y) return '#t';
        return '#f';
    },
    '=': function(x,y) {
        if (x === y) return '#t';
        return '#f';
    },
    car: function(lst) {
        return lst.shift();
    },
    cdr: function(lst) {
        lst.shift();
        return lst;
    },
    cons: function(x, lst) {
        lst.unshift(x);
        return lst;
    },
    alert: function(x){
        if (typeof module !== 'undefined') {
            console.log(x);
        } else {
            alert(x);
        }
    }
}

var lookup = function (env, v) {
    if (!(env.hasOwnProperty('bindings'))) {
        if (initialEnv.hasOwnProperty(v)) return initialEnv[v];
        throw new Error(v + " not found");
    }
    if (env.bindings.hasOwnProperty(v)) return env.bindings[v];
    return lookup(env.outer, v);    
};

var update = function (env, v, val) {
    if (!(env.hasOwnProperty('bindings'))) throw new Error(v + " not found");
    if(env.bindings.hasOwnProperty(v)) {
        env.bindings[v] = val;
    } else {
        update(env.outer, v, val);
    }
};

var add_binding = function (env, v, val) {
    if (!(env.hasOwnProperty('bindings'))) {
        env.bindings = {};
        env.outer = {};
    }
    env.bindings[v] = val;
};

var evalScheem = function (expr, env) {
    var res = 0, list;
    if (typeof expr === 'number') {
        return expr;
    }
    if (typeof expr === 'string') {
        return lookup(env, expr);
    }
    switch (expr[0]) {
        case 'define':
            add_binding(env, expr[1], evalScheem(expr[2], env));
            return 0;
        case 'set!':
            update(env, expr[1], evalScheem(expr[2], env));
            return 0;
        case 'begin':
            for (var i = 1, j = expr.length; i < j; i++) {
                res = evalScheem(expr[i], env);
            }
            return res;
        case 'quote':
            return expr[1];
        case 'if':
            return evalScheem(expr[1], env) === '#t' ? evalScheem(expr[2], env) : evalScheem(expr[3], env);
        // case 'let-one':
        //     var bnds = {};
        //     bnds[expr[1]] = evalScheem(expr[2], env);
        //     var newenv = { bindings: bnds, outer: env};
        //     return evalScheem(expr[3], newenv);
        case 'let':
            var bnds = {};
            for (var i = expr[1].length - 1; i >= 0; i--) {
                bnds[expr[1][i][0]] = evalScheem(expr[1][i][1], env);
            }
            var newenv = { bindings: bnds, outer: env};
            return evalScheem(expr[2], newenv);
        // case 'lambda-one':
        //     return function(arg) {
        //         var bnd = {};
        //         bnd[expr[1]] = evalScheem(arg, env);
        //         var newenv = { bindings: bnd, outer: env };
        //         return evalScheem(expr[2], newenv);
        //     };
        case 'lambda':
            return function() {
                var bnd = {};
                for (var i = expr[1].length - 1; i >= 0; i--) {
                    bnd[expr[1][i]] = evalScheem(arguments[i], env);
                };
                var newenv = { bindings: bnd, outer: env };
                return evalScheem(expr[2], newenv);
            }
        default:
            var func = evalScheem(expr[0], env);
            var args = [];
            for (var i = expr.length - 1; i >= 1; i--) {
                args[i-1] = evalScheem(expr[i], env);
            }
            return func.apply(undefined, args);
    }
};

var evalScheemString = function (str, parse, env) {
    return evalScheem(parse(str), env);
}

// If we are used as Node module, export evalScheem
if (typeof module !== 'undefined') {
    module.exports.evalScheem = evalScheem;
    module.exports.evalScheemString = evalScheemString;
}