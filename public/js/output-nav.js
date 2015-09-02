/* global $, Hammer */
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