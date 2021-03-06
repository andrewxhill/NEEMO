/*
* GOD sees everything
*/
var GOD = (function() {
  var subscribers = {};
  var debug = false;

  function unsubscribe(event) {
    debug && console.log("Unsubscribe ->", event);
    delete subscribers[event];
  }

  function subscribe(event) {
    debug && console.log("Subscribe ->", event);

    subscribers[event] = event
  }

  function _signal(event) {
    debug && console.log("Signal to ", event);

    $(window).trigger(event);
    unsubscribe(event);
  }

  function _signalAll() {
    if (!_.isEmpty(subscribers)) {
      _.each(subscribers, _signal);
    }
  }

  // send signal to all the other subscribers
  function broadcast(protectedEvent) {
    _.each(subscribers, function(event) {
      //protectedEvent != event && _signal(event);
    });
  }

  $(function() {
    $(document).keyup(function(e) {
      e.keyCode == 27 && _signalAll();
    });

    $('html').click(_signalAll);
  });

  return {
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    broadcast: broadcast
  };
})();

function removeLockScreen(callback) {
  var $lock_screen = $("#lock_screen");

  if ($lock_screen.length) {
    $lock_screen.fadeOut(150, function() { $(this).remove(); });
  }
}

function toggleLockScreen(callback) {
  var $lock_screen = $("#lock_screen");

  if ($lock_screen.length) {
    $lock_screen.fadeOut(150, function() { $(this).remove(); });
  } else {
    $("body").append("<div id='lock_screen'></div>");
    $("#lock_screen").height($(document).height());
    $("#lock_screen").fadeIn(150, function() {
      callback && callback();
    });
  }
}

function browserReady() {
  var ua = $.browser;

  // Version checker
  // IE9+  FF4+  Safari4+  Chrome8+  Opera 11+

  // If browser is a Chrome version
  var userAgent = navigator.userAgent.toLowerCase();
  $.browser.chrome = /chrome/.test(navigator.userAgent.toLowerCase());

  if ($.browser.chrome){
    var userAgent = userAgent.substring(userAgent.indexOf('chrome/') +7);
    var chrome_version = userAgent.substring(0,userAgent.indexOf('.'));
    ua.safari = false;
  }

  if (((ua.msie && ua.version<9) || (ua.mozilla && parseFloat(ua.version.slice(0,3)) < 2) || (ua.safari && parseFloat(ua.version.slice(0,3)) < 400) || ua.opera  || (!ua.safari && chrome_version<10))) {
    window.location.href = '/old.html';
  }
};


jQuery.fn.helpShortcuts = function(opt) {

  var $el,
  id = "helpShortcuts",
  speed  = (opt && opt.speed) || 200,
  easingMethod = (opt && opt.easingMethod) || "easeOutExpo",
  $popover = $(".shortcuts");

  $(window).bind('_close.' + id, function() {
    _close($popover);
  });

  function _close(el) {
    GOD.unsubscribe("_close." + id);
    el.fadeOut(speed);
    toggleLockScreen();
  }

  this.each(function() {
    $el = $(this);

    var event = "_close.help";

    $popover.find(".close").click(function() {
      _close($popover);
    });

    $el.click(function(e) {
      e.preventDefault();
      e.stopPropagation();
      $popover.fadeIn(speed);
      toggleLockScreen();
      GOD.subscribe("_close." + id);
      GOD.broadcast("_close." + id);
    });
  });
}

var BeginnersHelp = function(e, opt){

  var $el = $(".help"),
  id = "beginnersHelp",
  speed  = (opt && opt.speed) || 200,
  easingMethod = (opt && opt.easingMethod) || "easeOutExpo";

  $(window).bind('NewUser', _open);

  $(document).keyup(function(e) {
    e.keyCode == 27 && _close($el);
  });

  $(".close_help").click(function() {
    _close($el);
  });

  function _open(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    toggleLockScreen(function() {
      $(".beginners_diagram").fadeIn(speed);
    });
  }

  function _close($el) {
    $el.fadeOut(speed);
    $(".beginners_diagram").fadeOut(speed, function() {
      removeLockScreen();
    });
  }

  return {
    open: _open,
    close: _close
  };
}

 var HelpInfo = function(e, opt){

  var $el = $(".help"),
  id = "helpInfo",
  panelWidth = 485,
  imageWidth = 171,
  speed  = (opt && opt.speed) || 200,
  easingMethod = (opt && opt.easingMethod) || "easeOutExpo";

  function _updateHeader($species) {
    var name = $species.attr("class");
    if (name == "other") {
      $el.find("h3").html("Other");
    } else {
      $el.find("h3").html("What is a " + name + "?");
    }
  }

  function _hide() {
    $el.animate({opacity:0, left:$el.position().left - 50}, speed, function() {
      $el.css({display:"none"});
    });
  }

  function _show(x, y) {
    $el.css({display:"block", opacity:0, left:x - $el.width(), top:y - 50});
    $el.animate({opacity:1, left:x - $el.width() - 50}, speed);
  }

  function _move(x, y) {
    $el.animate({top:y - 50}, speed);
  }

  function _select($asideLi) {
    var c = $asideLi.attr("class");
    var $species = $el.find("li." + c);

    if ($species.index() >= 0) {
      $el.find(".inner").scrollTo($species.index() * panelWidth, speed, {easing:easingMethod} );
      _updateHeader($species);
    }
  }

  function _start() {

    $(window).bind('_close.' + id, _close);
    $el.find(".close").click(_close);

    $el.click(function(e) {
      e.stopPropagation();
    });

    $el.find(".nav").click(function(e) {
      e.stopPropagation();
      var direction = "+=";
      var distance = imageWidth;

      if ($(this).hasClass("previous")) {
        $species = $(this).parents("li").prev("li");
        direction = "-=";
      }
      $(this).parent().find(".slideshow_inner").scrollTo(direction + distance, speed, {easing:easingMethod} );

    });

    $el.find(".more-info").click(function(e) {
      e.preventDefault();
      e.stopPrevent();

      var $species = $(this).parents("li").next("li");
      var direction = "+=";
      var distance = panelWidth;

      if ($(this).hasClass("previous")) {
        $species = $(this).parents("li").prev("li");
        direction = "-=";
      } else if ($(this).hasClass("first")) {
        $species = $(this).parents("ul").find("li:first-child");
        direction = 0;
        distance = 0;
      }

      $el.find(".inner").scrollTo(direction + distance, speed, {easing:easingMethod} );
      _updateHeader($species);
    });
  }

  function _goto(el) {
    $el.find(".inner").scrollTo(direction + distance, speed, {easing:easingMethod} );
  }

  function _open(e) {
    e.preventDefault();
    e.stopPropagation();
    var $li = $(e.target).closest("li");

    if ($el.hasClass("open")) {
      _move($li.offset().left, $li.offset().top);
    } else {
      $el.addClass("open");

      GOD.subscribe("_close." + id);
      GOD.broadcast("_close." + id);

      $("aside li").unbind("click");
      $("aside li").click(function(e) {
        e.stopPropagation();
        _open(e);
      });

      _show($li.offset().left, $li.offset().top);
    }
    _select($li);
  }

  function _close() {
    GOD.unsubscribe("_close." + id);
    $(".help").removeClass("open");
    _hide();
  }

  return {
    start: _start,
    open: _open,
    close: _close
  };
 }





/*
* Controls the behaviour of the navigation menu
* */
 jQuery.fn.navigationHover = function(opt) {

   var speed  = (opt && opt.speed) || 100;
   var easingMethod = (opt && opt.easingMethod) || "easeOutExpo";
   var $currentOption;

   function select($option) {
     var l = $option.position().left;
     var w = $option.width();

     $option.parent().siblings("li.selected").removeClass("selected");
     $option.parent().addClass("selected");

     $(".bar").animate({opacity:1, width:w, left:l}, speed, easingMethod);
   }

   this.each(function() {

     if ($(this).find(".selected")) {
       $currentOption = $(this).find("li.selected a");

       $currentOption.click(function(e) {
         e.preventDefault();
       });

       var sel = function() { select($currentOption, speed);}
       setTimeout(sel, 500);
     }

     $(this).mouseleave(function(e){
       select($currentOption);
     });

     $(this).find("a").hover(function(e){
       select($(this), speed);
     });
   });
 }
