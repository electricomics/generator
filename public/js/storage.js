var Storage = function(name) {
  var item = name;
  
  this.get = function() {
    try {
      return JSON.parse(localStorage[item]);
    } catch (e) {
      // console.log(e);
      return false;
    }
  };

  this.save = function(val) {
    var txt = '';
    try {
      if (typeof val === 'object' && val) {
        txt = JSON.stringify(val);
      }
      else if (typeof val === 'string' && val) {
        txt = val;
      }
      localStorage[item] = txt;
      return true;
    } catch (e) {
      // console.log(e);
      return false;
    }
  };

  this.clear = function() {
    try {
      localStorage.removeItem(item);
      return true;
    } catch (e) {
      // console.log(e);
      return false;
    }
  };
};