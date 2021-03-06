var setErrorMessage = function(statusCode, msg) {
    return {
        code: statusCode,
        message: msg
    };
};

var createIterator = function(arr) {
    currentIndex = 0;

    return {
        next: function() {
            return (currentIndex < arr.length ? {
                value: arr[currentIndex++],
                done: false
            } : { done: true });
        }
    };
};

var waterfall = function(funcs, callback) {
    callback = callback || function() {};

    if(!Array.isArray(funcs))
        throw new Error("funcs are not of type array");
    else if(funcs.length <= 0)
        throw new Error("array is empty!");

    var iterator = createIterator(funcs);

    (function _obj() {
        var nxt = iterator.next();
        var err = arguments[0];
        var args = [];

        //not so nice looking copy to keep vm optimizations
        for(var i = (nxt.done ? 0 : 1), l = arguments.length; i < l; i++)
            args.push(arguments[i]);
        args.push(_obj);

        if(!nxt.done && !err)
            nxt.value.apply(nxt.value, args);
        else
            callback.apply(callback, (!err ? args : [err]));
    })();
};

var loginClient = function(client, tries) {
    tries = tries || 0;

    waterfall([
        client.getCSRF.bind(client),
        client.setLogin.bind(client),
        client._getAuthToken.bind(client)
    ], function _loginCredentialCheck(err) {
        if(err) {
            if(tries < 2 && err.code !== 401) {
                client.log("an error occured while trying to log in", 0, "red");
                client.log(err, 2, "red");
                client.log("retrying...", 0);
                loginClient(client, ++tries);
            } else {
                client.log("couldn't log in.", 0, "red");
                client.emit(client.LOGIN_ERROR, err);
            }
        } else {
            client._loggedIn.call(client);
        }
    });
};

var splitTitle = function(title) {
    title = title || "";

    if(typeof title === "string") {
        if(title.indexOf('-') >= 0)
            title = title.split('-').map(function(str) { return str.trim(); });
        else if(title.indexOf(' ') >= 0)
            title = title.split(' ').map(function(str) { return str.trim(); });
        else
            title = [title, title];
    }

    return title;
};

var decode = function(str) {
    if(typeof str !== "string")
        return str;

    return str
    .replace(/&#34;/g, '\\\"')
    .replace(/&#39;/g, '\'')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

exports.setErrorMessage = setErrorMessage;
exports.createIterator = createIterator;
exports.loginClient = loginClient;
exports.splitTitle = splitTitle;
exports.waterfall = waterfall;
exports.decode = decode;
