/* global $ */
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
  var $main = $('#main');
  var $left = $('<div class="left" title="previous page">&larr;</div>');
  var $right = $('<div class="left" title="next page">&rarr;</div>');
  $left.css({
    position: 'absolute',
    background: '#FFF',
    top: '50%',
    cursor: 'pointer',
    'line-height': '2em',
    width: '2em'
  });
  $right.css({
    position: 'absolute',
    background: '#FFF',
    top: '50%',
    right: '0',
    cursor: 'pointer',
    'line-height': '2em',
    width: '2em'
  });
  $main.append($left).append($right);
  $right.on('click', function() {
    nextPage();
  });
  $left.on('click', function() {
    prevPage();
  });
});