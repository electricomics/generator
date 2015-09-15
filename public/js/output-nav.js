/* global $, Hammer */
/*!
 * Electricomics
 * https://github.com/electricomics
 *
/*    
@licstart  The following is the entire license notice for the 
JavaScript below.

Copyright (C) 2015  Electricomics CIC

The JavaScript code in this page is free software: you can
redistribute it and/or modify it under the terms of the GNU
General Public License (GNU GPL) as published by the Free Software
Foundation, either version 3 of the License, or (at your option)
any later version.  The code is distributed WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.

As additional permission under GNU GPL version 3 section 7, you
may distribute non-source (e.g., minimized or compacted) forms of
that code without the copy of the GNU GPL normally required by
section 4, provided you include this license notice and a URL
through which recipients can access the Corresponding Source.   


@licend  The above is the entire license notice
for the JavaScript code in this page.
*/
$(document).ready(function() {
  var currentPage = 0;
  var pre = 'page';
  var c = 'show';
  var nextPage = function() {
    var $newPage = $('.' + pre + (currentPage + 1));
    if ($newPage.length) {
      $('.' + pre + currentPage).removeClass(c);
      $newPage.addClass(c);
      currentPage++;
    }
  };
  var prevPage = function() {
    var $newPage = $('.' + pre + (currentPage - 1));
    if ($newPage.length) {
      $('.' + pre + currentPage).removeClass(c);
      $newPage.addClass(c);
      currentPage--;
    }
  };
  nextPage();
  var main = $('#main').get(0);
  var mc = new Hammer(main);
  mc.on('swipeleft', function() {
    nextPage();
  });
  mc.on('swiperight', function() {
    prevPage();
  });
});