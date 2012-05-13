var lookup = function (env, v) {
    if (!(env.hasOwnProperty('bindings'))) throw new Error(v + " not found");
    if (env.bindings.hasOwnProperty(v)) return env.bindings[v];
    return arguments.callee(env.outer, v);    
};

var update = function (env, v, val) {
    if (!(env.hasOwnProperty('bindings'))) throw new Error(v + " not found");
    if(env.bindings.hasOwnProperty(v)) {
        env.bindings[v] = val;
    } else {
        arguments.callee(env.outer, v, val);
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
    // Numbers evaluate to themselves
    var res = 0, list;
    if (typeof expr === 'number') {
        return expr;
    }
    // Strings are variable references
    if (typeof expr === 'string') {
        return lookup(env, expr);
    }
    // Look at head of list for operation
    switch (expr[0]) {
        case '+':
            return evalScheem(expr[1], env) +
                   evalScheem(expr[2], env);
        case '-':
            return evalScheem(expr[1], env) -
                   evalScheem(expr[2], env);
        case '*':
            return evalScheem(expr[1], env) *
                   evalScheem(expr[2], env);
        case '/':
            return evalScheem(expr[1], env) /
                   evalScheem(expr[2], env);
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
        case '<':
            if (evalScheem(expr[1], env) <
                   evalScheem(expr[2], env)) return '#t';
            return '#f';
        case '=':
            var eq =
                (evalScheem(expr[1], env) ===
                 evalScheem(expr[2], env));
            if (eq) return '#t';
            return '#f';
        case 'if':
            return evalScheem(expr[1], env) === '#t' ? evalScheem(expr[2], env) : evalScheem(expr[3], env);
        case 'cons':
            list = evalScheem(expr[2], env);
            list.unshift(evalScheem(expr[1], env));
            return list;
        case 'car':
            return evalScheem(expr[1], env).shift();
        case 'cdr':
            list = evalScheem(expr[1], env);
            list.shift();
            return list;    
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