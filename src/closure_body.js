    var ___r,
        ___version = "@VERSION",
        ___ctx,
        ___self,
        ___ext;

    var ___setRuntime = function( rt ) {
        rt.checkVersion( ___version );
        ___r = rt;
        ___ext = ___r.___getExtensions();
    };
