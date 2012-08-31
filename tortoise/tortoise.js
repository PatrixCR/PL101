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
    // Statements always have tags
    switch(stmt.tag) {
        // A single expression
        case 'ignore':
            // Just evaluate expression
            return evalExpr(stmt.body, env);
    }
};