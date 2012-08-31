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

// Evaluate a Tortoise expression, return value
var evalExpr = function (expr, env) {
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
        return expr;
    }
    // Look at tag to see what to do
    switch(expr.tag) {
        // Simple built-in binary operations
        case '<':
            return evalExpr(expr.left, env) <
                   evalExpr(expr.right, env);
        case '+':
            return evalExpr(expr.left, env) +
                   evalExpr(expr.right, env);
        case '*':
            return evalExpr(expr.left, env) *
                   evalExpr(expr.right, env);
        case 'call':
            // Get function value
            var func = lookup(env, expr.name);
            // Evaluate arguments to pass
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
    // Statements always have tags
    switch(stmt.tag) {
        // A single expression
        case 'ignore':
            // Just evaluate expression
            return evalExpr(stmt.body, env);
        // Declare new variable
        case 'var':
            // New variable gets default value of 0
            add_binding(env, stmt.name, 0);
            return 0;
        case ':=':
            // Evaluate right hand side
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
            // name args body
            var new_func = function() {
                // This function takes any number of arguments
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