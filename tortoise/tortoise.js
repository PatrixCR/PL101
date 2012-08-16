// Evaluate a Tortoise program
// env is like:
// { bindings: { x: 5, ... }, outer: { } }

// Lookup a variable in an environment
var lookup = function (env, v) {
    if (!(env.hasOwnProperty('bindings')))
        throw new Error(v + " not found");
    if (env.bindings.hasOwnProperty(v))
        return env.bindings[v];
    return lookup(env.outer, v);
};

// Update existing binding in environment
var update = function (env, v, val) {
    if (env.hasOwnProperty('bindings')) {
        if (env.bindings.hasOwnProperty(v)) {
            env.bindings[v] = val;
        } else {
            update(env.outer, v, val);
        }
    } else {
        throw new Error('Undefined variable update ' + v);
    }
};

// Add a new binding to outermost level
var add_binding = function (env, v, val) {
    if(env.hasOwnProperty('bindings')) {
        env.bindings[v] = val;
    } else {
        env.bindings = {};
        env.outer = {};
        env.bindings[v] = val;
    }
};

// Evaluate a string in a given environment
// Environment has bindings but no outer allowed
// Binding values are JavaScript actual values
var evalEnv = function (env) {
    
};

/* Given parsed expression, return a JavaScript string
   that can be evaluated to give the result of expression.
*/
var compileExpr = function (expr) {
    if (typeof expr === 'number') {
        return expr.toString();
    }
    switch(expr.tag) {
        case '+':
            return '(' + compileExpr(expr.left) + ')+(' + compileExpr(expr.right) + ')';
        case '-':
            return '(' + compileExpr(expr.left) + ')-(' + compileExpr(expr.right) + ')';
        case '*':
            return '(' + compileExpr(expr.left) + ')*(' + compileExpr(expr.right) + ')';
        case '<':
            return '(' + compileExpr(expr.left) + ')<(' + compileExpr(expr.right) + ')';
        case '>':
            return '(' + compileExpr(expr.left) + ')>(' + compileExpr(expr.right) + ')';
        case 'ident':
            return expr.name;
        case 'call':
            // Get function value (in Tortoise can only be a name)
            var func = expr.name;
            // Evaluate arguments to pass
            var args = [];
            var i = 0;
            for(i = 0; i < expr.args.length; i++) {
                args[i] = compileExpr(expr.args[i]);
            }
            return expr.name + '(' + args.join(',') + ')';
        // Should not get here
        default:
            throw new Error('Unknown form in AST expressionEXPR ' + expr.tag);
    }
};

/* Functions needed by evalCompiled */
var repeat = function (num, func) {
    var i;
    var res;
    for(i = 0; i < num; i++) {
        res = func();
    }
    return res;
};

var compileEnvironment = function (bindings) {
    var i, res, name, val;
    res = '';
    for(i = 0; i < bindings.length; i++) {
        name = bindings[i][0];
        val = bindings[i][1];
        res += 'var ' + name + ' = ' + val.toString() + ';\n';
    }
    return res;
};

/* Evaluate a compiled expression.
   Locally defines any needed helper functions.
*/
var evalCompiled = function (txt, env) {
    if(env) {
        return eval(compileEnvironment(env) + txt);
    }
    return eval(txt);
};

/* Generate full source code of compiled program */
var standalone = function (stmts, env, modular) {
    var txt = compileEnvironment(env);
//    txt += 'var repeat = ' + repeat + ';\n';
    txt += compileStatements(stmts);
    if (modular) {
        return '(function () {\n' + txt + '\n})();\n';
    } else {
        return txt;
    }
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
            return evalExpr(expr.left, env) < evalExpr(expr.right, env);
        case '<=':
            return evalExpr(expr.left, env) <= evalExpr(expr.right, env);
        case '>':
            return evalExpr(expr.left, env) > evalExpr(expr.right, env);
        case '>=':
            return evalExpr(expr.left, env) >= evalExpr(expr.right, env);
        case '==':
            return evalExpr(expr.left, env) === evalExpr(expr.right, env);
        case '!=':
            return evalExpr(expr.left, env) !== evalExpr(expr.right, env);
        case '+':
            return evalExpr(expr.left, env) + evalExpr(expr.right, env);
        case '-':
            return evalExpr(expr.left, env) - evalExpr(expr.right, env);
        case '*':
            return evalExpr(expr.left, env) * evalExpr(expr.right, env);
        case '/':
            return evalExpr(expr.left, env) / evalExpr(expr.right, env);
        // Lookup identifiers
        case 'ident':
            return lookup(env, expr.name);
        // Function calls
        case 'call':
            // Get function value (in Tortoise can only be a name)
            var func = lookup(env, expr.name);
            // Evaluate arguments to pass
            var ev_args = [];
            var i = 0;
            for(i = 0; i < expr.args.length; i++) {
                ev_args[i] = evalExpr(expr.args[i], env);
            }
            return func.apply(null, ev_args);
        // Should not get here
        default:
            throw new Error('Unknown form in AST expression ' + expr.tag);
    }
};

var compileStatement = function (stmt) {
    var i;
    var num;
    var body;
    var cond_expr;
    var val = undefined;
    // Statements always have tags
    switch(stmt.tag) {
        // A single expression
        case 'ignore':
            // Just evaluate expression
            return '_res = (' + compileExpr(stmt.body) + ');\n';
        // Assignment
        case ':=':
            return '_res = (' + stmt.left + ' = ' + compileExpr(stmt.right) + ');\n';
        // Declare new variable
        case 'var':
            // Evaluates to 0
            return '_res = 0;\nvar ' + stmt.name + ';\n';
        // Repeat
        case 'repeat':
            num = compileExpr(stmt.expr);
            body = compileStatements(stmt.body, true);
            return '_res = repeat(' + num + 
                ', function(){' + body + '});\n';
        // If
        case 'if':
            cond_expr = compileExpr(stmt.expr);
            body = compileStatements(stmt.body, false);
            return '_res = undefined;\nif(' + cond_expr + ') {\n' + body + '}\n'
        // Define new function
        case 'define':
            // name args body
            return '_res = 0;\nvar ' + stmt.name + ' = function(' + stmt.args.join(',') + ') {' +
                compileStatements(stmt.body, true) + '};\n';
        // Should not get here
        default:
            console.log(stmt);
            throw new Error('Unknown form in AST statement ' + stmt.tag);
    }
};

// Evaluate a Tortoise statement
var evalStatement = function (stmt, env) {
    var i;
    var num;
    var cond_expr;
    var val = undefined;
    // Statements always have tags
    switch(stmt.tag) {
        // A single expression
        case 'ignore':
            // Just evaluate expression
            return evalExpr(stmt.body, env);
        // Assignment
        case ':=':
            // Evaluate right hand side
            val = evalExpr(stmt.right, env);
            update(env, stmt.left, val);
            return val;
        // Declare new variable
        case 'var':
            // New variable gets default value of 0
            add_binding(env, stmt.name, 0);
            return 0;
        // Repeat
        case 'repeat':
            // Evaluate expr for number of times to repeat
            num = evalExpr(stmt.expr, env);
            // Now do a loop
            for(i = 0; i < num; i++) {
                val = evalStatements(stmt.body, env);
            }
            return val;
        // If
        case 'if':
            cond_expr = evalExpr(stmt.expr, env);
            val = undefined;
            if(cond_expr) {
                val = evalStatements(stmt.body, env);
            }
            return val;
        // Define new function
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
        // Should not get here
        default:
            throw new Error('Unknown form in AST statement ' + stmt.tag);
    }
};

var compileStatements = function (seq, is_funcbody) {
    var res = '';
    var i;
    res += 'var _res;\n';
    for(i = 0; i < seq.length; i++) {
        res += compileStatement(seq[i]);
    }
    if(is_funcbody) res += 'return _res;\n';
    return res;
};
//~ 
//~ var compileStatements = function (seq, returnlast) {
    //~ var res = 'var _res;\n';
    //~ var i;
    //~ for(i = 0; i < seq.length; i++) {
        //~ res += compileStatement(seq[i]);
        //~ if(i == seq.length - 1 && returnlast) {
            //~ res += 'return _res;\n';
        //~ }
    //~ }
    //~ return res;
//~ };

// Evaluate a list of Tortoise statements, return undefined
var evalStatements = function (seq, env) {
    var i;
    var val = undefined;
    for(i = 0; i < seq.length; i++) {
        val = evalStatement(seq[i], env);
    }
    return val;
};

// If we are used as Node module, export symbols
if (typeof module !== 'undefined') {
    module.exports.lookup = lookup;
    module.exports.evalExpr = evalExpr;
    module.exports.evalStatement = evalStatement;
    module.exports.evalStatements = evalStatements;
    module.exports.compileExpr = compileExpr;
    module.exports.compileStatement = compileStatement;
    module.exports.compileStatements = compileStatements;
    module.exports.evalCompiled = evalCompiled;
    module.exports.standalone = standalone;
}