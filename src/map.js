var Map = (function() {
    var method = Map.prototype,
        hasProp = {}.hasOwnProperty;

    function Map() {
        this._map = {};      
    }
    
    method.clear = function() {
        this._map = {};
    };
    
    method.has = function( key ) {
        return hasProp.call( this._map, key );
    };
    
    method.remove = function( key ) {
        if( this.has( key ) ) {
            delete this._map[key];
        }
    };
    
    method.set = function( key, value ) {
        this._map[key] = value;
    };
    
    method.setIfAbsent = function( key, value ) {
        if( !this.has( key ) ) {
            this.set( key, value );
        }
    };
    
    var clone = function( key, value ) {this.set(key, value);}
    method.clone = function() {
        var ret = new Map();
        this.forEachCtx( clone, ret );
        return ret;
    };
    
    method.setAll = function( keys ) {
        for( var key in keys ) {
            if( hasProp.call( keys, key ) ) {
                this.set( key, keys[key] );
            }
        }
    };
    
    method.get = function( key ) {
        if( this.has( key ) ) {
            return this._map[key];
        }
        return null;
    };
    
    method.forEach = function( fn ) {
        var i = 0;
        for( var key in this._map ) {
            if( this.has( key ) ) {
                if( fn( key, this._map[key], i++ ) === false ) {
                    break;
                }
            }
        }
    };
    
    //TODO Macro
    method.forEach$1 = function( fn, $1 ) {
        var i = 0;
        for( var key in this._map ) {
            if( this.has( key ) ) {
                if( fn( $1, key, this._map[key], i++ ) === false ) {
                    break;
                }
            }
        }
    };

    method.forEach$2 = function( fn, $1, $2 ) {
        var i = 0;
        for( var key in this._map ) {
            if( this.has( key ) ) {
                if( fn( $1, $2, key, this._map[key], i++ ) === false ) {
                    break;
                }
            }
        }
    };
    
    method.forEach$3 = function( fn, $1, $2, $3 ) {
        var i = 0;
        for( var key in this._map ) {
            if( this.has( key ) ) {
                if( fn( $1, $2, $3, key, this._map[key], i++ ) === false ) {
                    break;
                }
            }
        }
    };
    
    method.forEachCtx = function( fn, ctx ) {
        var i = 0;
        for( var key in this._map ) {
            if( this.has( key ) ) {
                if( fn.call( ctx, key, this._map[key], i++ ) === false ) {
                    break;
                }
            }
        }
    };

    var removeAll = function( key ) { this.remove( key ); };
    method.removeAll = function( map ) {
        map.forEachCtx( removeAll, this );
    };
    
    var merge = function( key, value ) { this.set( key, value ); };
    method.merge = function( map ) {
        map.forEachCtx( merge, this );
    };
    
  
    var mergeIfNotExists = function( key, value ) { 
        if( !this.has(key) ) {
            this.set( key, value ); 
        }
    };
    
    method.mergeIfNotExists = function( map ) {
        map.forEachCtx( mergeIfNotExists, this );
    };
    
    method.immutableView = function() {
        var ret = new ImmutableMap();
        ret._map = this._map;
        return ret;
    };
    
    var ImmutableMap = (function() {
        var _super = Map.prototype,
            method = ImmutableMap.prototype = Object.create(_super);
        
        method.constructor = ImmutableMap;
        
        function ImmutableMap() {
            _super.constructor.apply(this, arguments);
        }
        
        method.clear = method.set = method.setAll = method.remove = 
            method.removeAll = method.merge = method.mergeIfNotExists = 
            method.setIfAbsent = function() {
            throw new Error("immutable map");
        };
        
        return ImmutableMap;
    })();

    
    Map.EMPTY = new ImmutableMap();
    
    Map.Immutable = ImmutableMap;
    
    return Map;
})();
