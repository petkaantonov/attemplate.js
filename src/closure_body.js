    var ___runtime,
        ___version = "@VERSION",
        ___ctx,
        ___self,
        ___ext,
        ___ensureNumeric, ___trim, ___method,
        ___functionCall, ___inOp, ___hasown,
        ___ensureArrayLike,
        ___isArray, ___isObject, ___Safe, ___safeString__;

    var ___setRuntime = function( rt ) {
        rt.checkVersion( ___version );
        ___runtime = rt;
        ___ext = ___runtime.___getExtensions();
        ___ctx = ___runtime.contextParser;
        ___trim = ___runtime.trim;
        ___ensureNumeric = ___runtime.ensureNumeric;
        ___ensureArrayLike = ___runtime.ensureArrayLike;
        ___method = ___runtime.method;
        ___functionCall = ___runtime.functionCall;
        ___inOp = ___runtime.inOp;
        ___hasown = ___runtime.hasOwn;
        ___isArray = ___runtime.isArray;
        ___isObject = ___runtime.isObject;
        ___Safe = ___runtime.Safe;
        ___safeString__ = ___runtime.safeString;
    };
