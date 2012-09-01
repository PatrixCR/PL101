var lookup = function (env, v) {
    if (!(env.hasOwnProperty('bindings'))) throw new Error(v + " not found");
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

var evalExpr = function (expr, env) {
    if (typeof expr === 'number') {
        return expr;
    }
    switch(expr.tag) {
        case '<':
            return evalExpr(expr.left, env) <
                   evalExpr(expr.right, env);
        case '<=':
            return evalExpr(expr.left, env) <=
                   evalExpr(expr.right, env);
        case '>':
            return evalExpr(expr.left, env) >
                   evalExpr(expr.right, env);
        case '>=':
            return evalExpr(expr.left, env) >=
                   evalExpr(expr.right, env);
        case '!=':
            return evalExpr(expr.left, env) !==
                   evalExpr(expr.right, env);
        case '>':
            return evalExpr(expr.left, env) ===
                   evalExpr(expr.right, env);
        case '+':
            return evalExpr(expr.left, env) +
                   evalExpr(expr.right, env);
        case '-':
            return evalExpr(expr.left, env) -
                   evalExpr(expr.right, env);
        case '*':
            return evalExpr(expr.left, env) *
                   evalExpr(expr.right, env);
        case '/':
            return evalExpr(expr.left, env) /
                   evalExpr(expr.right, env);
        case 'call':
            var func = lookup(env, expr.name);
            var ev_args = [];
            var i = 0;
            for(i = 0; i < expr.args.length; i++) {
                ev_args[i] = evalExpr(expr.args[i], env);
            }
            return func.apply(null, ev_args);
        case 'ident':
            return lookup(env, expr.name)
    }
};

var evalStatement = function (stmt, env) {
    var val = undefined;
    switch(stmt.tag) {
        case 'ignore':
            return evalExpr(stmt.body, env);
        case 'var':
            add_binding(env, stmt.name, 0);
            return 0;
        case ':=':
            val = evalExpr(stmt.right, env);
            update(env, stmt.left, val);
            return val;
        case 'if':
            if(evalExpr(stmt.expr, env)) {
                val = evalStatements(stmt.body, env);
            }
            return val;
        case 'repeat':
            for(var i = evalExpr(stmt.expr, env) - 1; i >= 0; i--) {
                val = evalStatements(stmt.body, env);
            }
            return val;
        case 'define':
            var new_func = function() {
                var i;
                var new_env;
                var new_bindings;
                new_bindings = { };
                for(i = 0; i < stmt.args.length; i++) {
                    new_bindings[stmt.args[i]] = arguments[i];
                }
                new_env = { bindings: new_bindings, outer: env };
                return evalStatements(stmt.body, new_env);
            };
            add_binding(env, stmt.name, new_func);
            return 0;
    }
};

var evalStatements = function (seq, env) {
    var i;
    var val = undefined;
    for(i = 0; i < seq.length; i++) {
        val = evalStatement(seq[i], env);
    }
    return val;
};

if (typeof module !== 'undefined') {
    module.exports.lookup = lookup;
    module.exports.evalExpr = evalExpr;
    module.exports.evalStatement = evalStatement;
    module.exports.evalStatements = evalStatements;
}