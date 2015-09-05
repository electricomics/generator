(function() {
  'use strict';

  function Storage (options) {
    var opts = options || {};
    var isNative = true;
    var storage = {};
    var namespace = opts.namespace || null;
    var type = opts.type || 'localStorage';
    var length = 0;
    var nativeStorage;

    try {
      nativeStorage = window[type];
      if (typeof nativeStorage === 'undefined') {
        isNative = false;
      }
    }
    catch(e) {
      isNative = false;
    }

    var storageToString = function() {
      return JSON.stringify(storage);
    };

    /*
     * Save into native storage
     * @returns {boolean} true if saving was successful
     */
    var save = function() {
      if (isNative) {
        // check for errors, for example if quota is exceeded
        try {
          nativeStorage.setItem(namespace, storageToString());
          return true;
        }
        catch (e) {
          return false;
        }
      }
    };

    /*
     * Remove from native storage
     */
    var removeNativeStorage = function() {
      if (isNative) {
        nativeStorage.removeItem(namespace);
      }
    };

    var calcLength = function() {
      length = 0;
      // using loop because it's faster
      // http://jsperf.com/calculate-object-length
      for (var k in storage) {
        if (storage.hasOwnProperty(k)) {
          length++;
        }
      }
    };

    Object.defineProperty(this, 'length', {
      get: function() {
        return length;
      }
    });

    Object.defineProperty(this, 'isNative', {
      get: function() {
        return isNative;
      }
    });

    /*
     * Set/get namespace for storage
     * @param {string} value - namespace
     */
    Object.defineProperty(this, 'namespace', {
      get: function() {
        return namespace;
      },
      set: function(value) {
        if (typeof value !== 'string') {
          return;
        }
        namespace = value;
      }
    });

    /*
     * Get some data from storage
     * @param {string} key - name of object property
     * @returns {*} value of object property
     */
    this.getItem = function(key) {
      return storage[key];
    };

    /*
     * Save some data into storage
     * @param {string} key - name of object property
     * @param {*} value - value of object property
     */
    this.setItem = function(key, value) {
      storage[key] = value;
      calcLength();
      save();
    };

    /*
     * Remove some data from storage
     * @param {string} key - name of the object property
     */
    this.removeItem = function(key) {
      delete storage[key];
      calcLength();
      save();
    };

    /*
     * Clear storage
     */
    this.clear = function() {
      storage = {};
      length = 0;
      removeNativeStorage();
    };

    /*
     * Find key by index
     * @param {number} i - index of the key
     * @returns {string} name of the key
     */
    this.key = function(i) {
      if (isNaN(i)) {
        return null; // should it be empty string?
      }
      var key = Object.keys(storage)[i];
      if (typeof key === 'undefined') {
        return null;
      }
      return key;
    };

    /*
     * Load current native storage data
     * @returns {boolean} true if load was successful
     */
    this.load = function() {
      if (isNative) {
        try {
          storage = JSON.parse(nativeStorage.getItem(namespace)) || {};
          calcLength();
        }
        catch (e) {
          return false;
        }
      }
      return false;
    };

    /*
     * Import data into storage
     * @param {string|Object} value - data to import
     * @returns {boolean} true if import was successful
     */
    this.import = function(value) {
      try {
        if (typeof value === 'string') {
          storage = JSON.parse(value);
        }
        if (typeof value === 'object') {
          storage = value;
        }
        storage = storage || {};
        calcLength();
        save();
        return true;
      }
      catch (e) {
        return false;
      }
    };

    /*
     * Export data from storage as a string
     * @param {string} format - type of the returned data - default is string
     * @returns {string|Object}
     */
    this.export = function(format) {
      if (format === 'string' || format == null) {
        return storageToString();
      }
      if (format === 'object') {
        return storage;
      }
    };

    return this;
  }

  window.Storage = Storage;
}());