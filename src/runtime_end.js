if( typeof module !== "undefined" && module.exports ) {
    module.exports = Runtime;
}
else if ( typeof define === "function" && define.amd && define.amd.attemplate ) {
    define( "Runtime", [], function () { return Runtime; } );
}
else if ( global ) {
    global.Runtime = Runtime;
}

})(this);