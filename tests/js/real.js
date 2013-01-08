(function( $ ) {
  $.fn.real = function() {
    return this.each(function() {
       $(this).html('random number: ' + Math.floor(Math.random()*1000));
    });
  };
})( jQuery );