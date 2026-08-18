$(document).ready(function() {
	$('input[name="wal"]').change(function(){
		if($(this).val() == '2'){
			$('#depo_ps option').each(function(){
				var value = $(this).val();
				console.log(value);
				value = value.replace("process_", "account_")
				$(this).val(value);
			});
		} else {
			$('#depo_ps option').each(function(){
				var value = $(this).val();
				console.log(value);
				value = value.replace("account_", "process_")
				$(this).val(value);
			});
		}
		
	});
  //menu
  $(".hamburger").click(function(){
    $(this).toggleClass("is-active");
    $(".main-menu").toggleClass("slide");
  });

  //lang
  //select-lang
  $('.selected-lang').click(function () {
    $(this).siblings('.lang-list').toggle();
    $(this).toggleClass('active');
  });
  $(window).click(function () {
    $('.lang-list').fadeOut('fast');
    $('.selected-lang').removeClass('active');
    $('.user-nav').removeClass('active');
    $('.user-name').removeClass('active');
  });
  $('.selected-lang').click(function (event) {
    event.stopPropagation();
  });
  $('.lang-list li').click(function () {
    var icon = $(this).find('a').html();
    $('.lang-list li').removeClass('active');
    $(this).addClass('active');
    $('.selected-lang span').remove();
    $(icon).clone().appendTo('.selected-lang');
    $('.lang-list').fadeOut('fast');
    $('.selected-lang').removeClass('active');
  });

  //accordion
  (function($) {
    $('.accordion > li:eq(0) .accordion-title').addClass('active').next().slideDown().parent().addClass('active');
    $('.accordion .accordion-title').click(function(j) {
      var dropDown = $(this).closest('li').find('.question-block');
      $(this).closest('.accordion').find('.question-block').not(dropDown).slideUp();
      if ($(this).hasClass('active')) {
        $(this).removeClass('active').parent().removeClass('active');
      } else {
        $(this).closest('.accordion').find('.accordion-title.active').removeClass('active').parent().removeClass('active');
        $(this).addClass('active').parent().addClass('active');
      }
      dropDown.stop(false, true).slideToggle();
      j.preventDefault();
    });
  })(jQuery);

  //placeholder
  $('input,textarea').focus(function () {
    $(this).data('placeholder', $(this).attr('placeholder'));
    $(this).attr('placeholder', '');
  });
  $('input,textarea').blur(function () {
    $(this).attr('placeholder', $(this).data('placeholder'));
  });

  //tabs
  $('ul.tabs__caption').on('click', 'li:not(.active)', function () {
    $(this).addClass('active').siblings().removeClass('active').closest('div.tabs').find('div.tabs__content').removeClass('active').eq($(this).index()).addClass('active');
  });

  //table-responsive
  $(function () {
    $('table.responsive').ngResponsiveTables();
  });

  //select
  $('select').styler();

  //waypoint
  var $headerMiddle = $('.header-main-middle');
  var $headerBottom = $('.header-main-bottom');
  var $mainMenu = $('.main-menu');

  $headerMiddle.waypoint(function(){
    $('.header-bg-text').addClass('fadeInLeft animated');
    $('.header-main-title').addClass('fadeInUp animated');
    $('.header-main-text').addClass('fadeInUp animated');
    $('.btn-start').addClass('fadeInUp animated');
  }, {
    offset: '80%'
  });

  $headerBottom.waypoint(function(){
    $('.social-buttons__item').addClass('fadeInLeft animated');
  }, {
    offset: '70%'
  });

  $mainMenu.waypoint(function(){
    $('.main-menu__item').addClass('fadeInUp animated');
  }, {
    offset: '90%'
  });


  var number = $('#counter');
  number.waypoint(function () {
    $('.counter--value').each(function () {
      var $this = $(this),
        countTo = $this.attr('data-count');
      $({
        countNum: $this.text()
      }).animate({
        countNum: countTo
      }, {
        duration: 3000,
        easing: 'swing',
        step: function step() {
          $this.text(Math.floor(this.countNum));
        },
        complete: function complete() {
          $this.text(this.countNum);
        }

      });
    });
  }, {
    offset: '70%'
  });

  wow = new WOW(
    {
      boxClass:     'wow',      // default
      animateClass: 'animated', // default
      offset:       100,          // default
      mobile:       true,       // default
      live:         true        // default
    }
  )
  wow.init();


  //popup-certificate
  $('.open-gallery-link').on('click', function (event) {
    event.preventDefault();
    var gallery = $(this).attr('href');
    $(gallery).magnificPopup({
      delegate: 'a',
      type: 'image',
      gallery: {
        enabled: true
      }
    }).magnificPopup('open');
  });

  $('.single-image-popup').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    mainClass: 'mfp-img-mobile',
    image: {
      verticalFit: true
    }
  });

  $('.popup-youtube').magnificPopup({
    disableOn: 300,
    type: 'iframe',
    mainClass: 'mfp-fade',
    removalDelay: 160,
    preloader: false,
    fixedContentPos: false
  });

  //slider
  $('.slider-video').slick({
    dots: true,
    arrows: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 3,
    slidesToScroll: 1,
    focusOnSelect: true,
    responsive: [{
      breakpoint: 991,
      settings: {
        slidesToShow: 2,
        arrows: false,
        centerMode: false
      }
    }, {
      breakpoint: 767,
      settings: {
        arrows: false,
        slidesToShow: 1,
        centerMode: false
      }
    }]
  });

  //icons input focus
  $('.input--icon').focus(function() {
    $(this).siblings('.form-input-icon').addClass('focus--icon');
  });

  $('.input--icon').blur(function () {
    $(this).siblings('.form-input-icon').removeClass('focus--icon');
  });


  //clipboard
  var clip1 = new Clipboard('#promo1');
  var clip2 = new Clipboard('#promo2');
  var clip3 = new Clipboard('#promo3');
  var clip4 = new Clipboard('#promo4');

  function bannerLink(id) {
    id.on('success', function (e) {
      swal({
        title: "Link copied",
        text: "You can paste text that has been copied by pressing Ctrl + V. The text that was copied last will be pasted.",
        type: "success",
        showCancelButton: false,
        confirmButtonClass: "btn-success",
        confirmButtonText: "OK!",
        closeOnConfirm: false,
        closeOnCancel: false
      });
    });
  }

  bannerLink(clip1);
  bannerLink(clip2);
  bannerLink(clip3);
  bannerLink(clip4);

  var affil1 = new Clipboard('#affiliater1');

  function affiliatelink(id) {
    id.on('success', function (e) {
      swal({
        title: "Your referral link copied!",
        text: "You can paste text that has been copied by pressing Ctrl + V. The text that was copied last will be pasted.",
        type: "success",
        showCancelButton: false,
        confirmButtonClass: "btn-success",
        confirmButtonText: "OK!",
        closeOnConfirm: false,
        closeOnCancel: false
      });
    });
  }

  affiliatelink(affil1);



});


//background-clip: text - emulation ie
Element.prototype.backgroundClipPolyfill = function () {
  var a = arguments[0],
    d = document,
    b = d.body,
    el = this;

  function hasBackgroundClip() {
    return b.style.webkitBackgroundClip != undefined;
  };

  function addAttributes(el, attributes) {
    for (var key in attributes) {
      el.setAttribute(key, attributes[key]);
    }
  }

  function createSvgElement(tagname) {
    return d.createElementNS('http://www.w3.org/2000/svg', tagname);
  }

  function createSVG() {
    var a = arguments[0],
      svg = createSvgElement('svg'),
      pattern = createSvgElement('pattern'),
      image = createSvgElement('image'),
      text = createSvgElement('text');

    // Add attributes to elements
    addAttributes(pattern, {
      'id' : a.id,
      'patternUnits' : 'userSpaceOnUse',
      'width' : a.width,
      'height' : a.height
    });

    addAttributes(image, {
      'width' : a.width,
      'height' : a.height
    });
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', a.url);

    addAttributes(text, {
      'x' : 0,
      'y' : 105,
      'class' : a['class'],
      'style' : 'fill:url(#' + a.id + ');'
    });

    // Set text
    text.textContent = a.text;

    // Add elements to pattern
    pattern.appendChild(image);

    // Add elements to SVG
    svg.appendChild(pattern);
    svg.appendChild(text);

    return svg;
  };

  /*
   * Replace the element if background-clip
   * is not available.
   */
  if (!hasBackgroundClip()) {
    var img = new Image();
    img.onload = function() {
      var svg = createSVG({
        'id' : a.patternID,
        'url' : a.patternURL,
        'class' : a['class'],
        'width' : this.width,
        'height' : this.height,
        'text' : el.textContent
      });

      el.parentNode.replaceChild(svg, el);
    }
    img.src = a.patternURL;
  }
};

var element = document.querySelector('.percent-amount');

/*
 * Call the polyfill
 *
 * patternID : the unique ID of the SVG pattern
 * patternURL : the URL to the background-image
 * class : the css-class applied to the SVG
 */