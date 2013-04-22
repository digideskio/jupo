

$(window).unload(function() {
  if (get_cookie('channel_id') != null && window.location.href.indexOf('/post/') == -1) {
    update_status('offline', false);
  }
});


$(document).ready(function(e) {
  
  if ( typeof $.global === 'undefined') {
    $.global = {};
    $.global.clear_autosave = {};
    $.global.preload = {};
  }

  $.global.title = 'Jupo';
  $.global.history = [];
  sessionStorage.clear();

  if ($('#header-container').length > 0) {
    init_avatar_uploader();
  }  
  refresh('#body');



  if (window.location.href.indexOf('#comment-') != -1) {
    var comment_id = window.location.href.split('#')[1]
    $('#' + comment_id).addClass('animate flash');
    
    offset_top = $('#' + comment_id).offset().top - 45;
    $('html,body').animate({
      scrollTop: offset_top
    }, 'fast');
  }



  $('.online-now .online-count').html($('#friends-online li.status.online').length + $('#friends-online li.status.away').length);
      
  
  // nginx push
  var channel_id;
  channel_id = get_cookie('channel_id');
  if (channel_id != null) {
    stream();
    start_pingpong();
    update_status('online');
  }
  
  
  // replace system tooltip with tipsy
  $('.likes, .viewers, .quick-stats, .see-changes, .reply-to').tipsy({
    gravity: 's',  
    live: true
  });
  
  $('#friends-online .status a').tipsy({
    gravity: 's',  
    delayIn: 500,
    html: true,
    live: true
  });
  

  // show default image until the image is loaded by the browser
  // $('img.small-avatar, img.medium-avatar').after(function () {
  // return '<img class="default-avatar ' + this.className + '"/>'
  // })
  // .hide()
  // .one('load', function() {
  // $(this).show().next().remove();
  // });

  $('body').attr('class', 'animate fadeIn');

  var message = get_parameter_by_name('message');
  if (message != "") {
    $('div#message').html(message).show(0).delay(15000).hide(0);
  }

  // check user timezone
  var timezone = jstz.determine_timezone();
  var offset = timezone.offset();
  var sign = offset[0];
  var parts = offset.substring(1).split(':');
  var utcoffset = sign + (parts[0] * 3600 + parts[1] * 60);
  set_cookie('utcoffset', utcoffset);

  // Auto load more posts
  $(window).scroll(function() {
    if ($('div#overlay').is(':visible') == false && $(window).scrollTop() + $(window).height() > get_doc_height() - 250) {
      console.log('scroll end');
      if ($.global.loading != true) {
        $('a.next').trigger('click');
      }
    }
  });

  // Archive posts
  $("#body, #overlay").on('click', "a.archive", function(e) {
    // Hide menu
    $('a.dropdown-menu-icon.active').parent().removeClass('active');
    $('a.dropdown-menu-icon.active').next('ul').hide();
    $('a.dropdown-menu-icon.active').removeClass('active');

    var href = $(this).attr("href");
    feed = $(this).parents('li.feed');

    message = '<div class="undo">' + 'This post has been archived. </strong>' + '<a class="undo" href="' + href.replace('/archive', '/unarchive') + '">Undo</a>' + '</div>';

    feed.animate({
      opacity: 0
    }, 0, function(e) {
      $('section', feed).hide();
      $('> a', feed).hide();
      $('> i', feed).hide();

      feed.append(message);
      feed.animate({
        opacity: 1
      }, 100);
    });

    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: $(this).attr("href"),
      success: function(id) {
        return false;
      }
    });
    return false;

  });

  // Confirm remove items
  $("#body, #overlay").on('click', "a.remove", function(e) {
    // show_loading();
    // Hide menu
    $('a.dropdown-menu-icon.active').parent().removeClass('active');
    $('a.dropdown-menu-icon.active').next('ul').hide();
    $('a.dropdown-menu-icon.active').removeClass('active');

    var href = $(this).attr("href");
    feed = $(this).parents('li.feed');
    
    message = '<div class="undo">' + 'This post has been removed. </strong>' + '<a class="undo" href="' + href.replace('remove', 'undo_remove') + '">Undo</a>' + '</div>';

    feed.animate({
      opacity: 0
    }, 0, function(e) {
      $('section', feed).hide();
      $('> a', feed).hide();
      $('> i', feed).hide();

      feed.append(message);
      feed.animate({
        opacity: 1
      }, 100);
    });

    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: $(this).attr("href"),
      success: function(id) {
        // hide_loading();

        return false;

      }
    });
    return false;

  });
  
  
  
  $('body').on('click', 'a.scroll', function(e) {
    id = $(this).attr('href');
   
    if ($(id).length == 0) {
      open_in_overlay_mode('#!/feed/' + id.split('-')[1]);
    } else {
      $('html,body').animate({scrollTop: $(id).offset().top},'fast');
    }
    // $('.notice-item-close', $(this).parents('div.notice-wrap')).trigger('click');
    
  })

  $('#body, #overlay').on('click', 'a.undo', function(e) {

    // Hide menu
    $('a.dropdown-menu-icon.active').parent().removeClass('active');
    $('a.dropdown-menu-icon.active').next('ul').hide();
    $('a.dropdown-menu-icon.active').removeClass('active');
    feed = $(this).parents('li.feed');
    href = $(this).attr("href");

    $('.undo', feed).remove();
    $('section footer', feed).show();
    $('section', feed).show();
    $('> a', feed).show();
    $('> i', feed).show();

    try {
      $('input[name="to"]', feed).tokenInput('clear');
      $('input[name="viewers"]', feed).tokenInput('clear');
    } catch(err) {
    }

    if (href != undefined) {
      $.ajax({
        type: "POST",
        headers: {
          'X-CSRFToken': get_cookie('_csrf_token')
        },
        url: $(this).attr("href"),
        success: function(id) {
          console.log('Undo: ' + id);
          return false;
        }
      });
    }

    return false;
  })

  $('#body, #overlay').on('click', 'a.forward', function(e) {
    
    // Hide menu
    $('a.dropdown-menu-icon.active').parent().removeClass('active');
    $('a.dropdown-menu-icon.active').next('ul').hide();
    $('a.dropdown-menu-icon.active').removeClass('active');
    feed = $(this).parents('li.feed section');
    href = $(this).attr("href");

    if (!$('footer.undo', feed).is(":visible")) {
      show_loading();
      $.ajax({
        type: "GET",
        url: $(this).attr("href"),
        success: function(html) {
          hide_loading();
          $('footer', feed).hide();
          feed.append(html);
          
          $('form.viewers input[id^="token-input-"]', feed).focus()
          return false;
        }
      });
    }
    return false;
  });

  $('#body, #overlay').on('submit', 'form.viewers', function(e) {
    show_loading();
    feed = $(this).parents('li.feed');
    feed_id = feed.attr('id');
    $.ajax({
      type: "POST",
      url: $(this).attr('action'),
      data: $(this).serializeArray(),
      success: function(html) {
        hide_loading();
        feed.replaceWith(html);
        refresh('#' + feed_id);
        return false;
      }
    });
    return false;

  })

  // $("a[rel=gallery], a.popup").fancybox({
    // mouseWheel: false,
    // loop: false,
    // closeBtn: false,
    // arrows: false,
    // closeClick: true,
  // });

  // Update online status based on mouse move
  // var mouse_move_timeout = null;
  // var move_count = 0;
  // $("html").mousemove(function() {
  // move_count += 1;
  //
  // if(move_count == 10) {
  // move_count = 0;
  // clearTimeout(mouse_move_timeout);
  // update_status('online');
  // mouse_move_timeout = setTimeout("update_status('away')", 30000);
  // }
  //
  // });

  /**
   * Mark as Read
   */

  var mark_as_read_timer = null;
  $("#body, #overlay").on('mouseenter', 'li.unread > section', function() {
    post_id = $(this).parent().attr('id');
    // li.feed
    mark_as_read_timer = setTimeout(function() {
      mark_as_read(post_id);
    }, 50);
  })

  $('#body').on('mouseleave', 'li.unread > section', function() {
    id = $(this).parent().attr('id');
    if (mark_as_read_timer) {
      clearTimeout(mark_as_read_timer)
    }
  });

  $('#body, #overlay').on('click', 'a.dropdown-menu-icon', function() {

    $('div#filters > ul').hide();

    if (!$(this).next('ul').is(':visible')) {
      // remove current active
      $('div.dropdown-menu.active ul').hide();
      $('div.dropdown-menu.active').removeClass('active');
      $('a.dropdown-menu-icon.active').removeClass('active');
    }

    $(this).parent().toggleClass('active');
    $(this).toggleClass('active');
    $(this).next('ul').toggle();
    return false;
  })

  $('#body, #overlay, #popup').on('click', 'form.new footer a', function() {
    var id = $(this).attr('id');
    var form = $(this).parents('form');
    
    // deactive all actived
    $('tr.toggle:not(#' + id + ')', form).hide();
    $('footer a:not(#' + id + ')', form).removeClass('active');

    $(this).toggleClass('active');
    $('tr#' + id, form).toggle();
    
    if (id == 'send-to' && $('tr#send-to', form).is(':visible')) {
      $('tr#send-to .token-input-list input[type="text"]').focus();
    }
    
  });

  /* Drop down menu */

  $('header nav a.user"').click(function() {
    var dm = $(this).next('ul.dropdown-menu');
    if (dm.hasClass('hidden')) {
      $('header nav ul.dropdown-menu').addClass('hidden');
      dm.removeClass('hidden');
      
      $('header nav .dropdown-menu-active').removeClass('dropdown-menu-active');
      $(this).addClass('dropdown-menu-active');
    } else {
      dm.addClass('hidden');
      $(this).removeClass('dropdown-menu-active');
    }
    return false;
  });
  
  
  $('header nav a.view-notifications').click(function() {
    
    var dm = $(this).next('ul.dropdown-menu');
    if (dm.hasClass('hidden')) {
      $('header nav ul.dropdown-menu').addClass('hidden');
      $('header nav ul.notifications').removeClass('hidden');
      $('header nav .dropdown-menu-active').removeClass('dropdown-menu-active');
      $(this).addClass('dropdown-menu-active');
      
      $('header nav ul.notifications .updating').show();
      
      $.ajax({
        type: "OPTIONS",
        cache: false,
        url: '/notifications',
        dataType: "json",
        success: function(resp) {
          
          
          $('header nav ul.notifications .updating').fadeOut();
      
          var item = $('#unread-notification-counter');
    
          value = resp.unread_notifications_count;
    
          item.html(value);
          
          var title = document.title;
          var pattern = /^\(.*?\) /gi;
          var count = title.match(pattern);
          if (value != 0) {
            $('#unread-notification-counter').removeClass('grey');
            if (count == null) {
              document.title = '(' + $('#unread-notification-counter').html() + ') ' + title;
            } else {
              document.title = title.replace(count, '(' + $('#unread-notification-counter').html() + ') ');
            }
          } else {
            $('#unread-notification-counter').addClass('grey');
            if (count != null) {
              document.title = title.replace(count, '');
            }
          }
          
          
          
          
          
          
          
          
          
          
          $('header nav ul.notifications ul').html(resp.body);
          refresh('header nav ul.notifications ul');
        }
      });
    } else {
      dm.addClass('hidden');
      $(this).removeClass('dropdown-menu-active');
    }
    return false;
    
  })
  /* End dropdown menu */

  // $('#scroll-to-top').scroll_to_top({
  // 'min': 400,
  // 'fadeSpeed': 500,
  // });

  // Refresh page after press Back button on browser
  $(window).bind('popstate', function(event) {
    // if the event has our history data on it, load the page fragment with
    // AJAX
    console.log(event);
    var state = event.originalEvent.state;
    if (state) {
      console.log(state);
      data = sessionStorage[state.path];
      if (state.path.indexOf('#!') != -1) {
        open_in_overlay_mode(state.path, data);
      } else {
        open_in_async_mode(state.path, state.rel, data);
      }
    }
  });

  $('#body, #overlay').on('click', 'a.rename', function() {
    filename = $(this).data('name');
    file_id = $(this).attr('data-id');
    href = $(this).attr('href');

    var new_name = prompt('Enter a new name for "' + filename + '"');
    if (!new_name) {
      return false;
    }
    show_loading();

    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      data: {
        name: new_name
      },
      url: href,
      success: function(resp) {
        hide_loading();
        console.log(file_id);
        $('#body li#' + file_id).replaceWith(resp);
        $('#overlay li#' + file_id).replaceWith(resp);
      }
    });
    return false;
  })

  $('#body, #overlay').on('click', 'a.toggle', function() {

    var new_class = $(this).data('class');
    var new_href = $(this).data('href');
    var new_name = $(this).data('name');
    var new_title = $(this).data('title');
    var href = $(this).attr('href');

    if (new_class != undefined) {
      $(this).data('class', $(this).attr('class'));
    }
    $(this).data('name', $(this).html());
    $(this).data('href', href);
    $(this).data('title', $(this).attr('title'));

    if (new_class != undefined) {
      $(this).attr('class', new_class.replace('toggle', '') + ' toggle');
    }
    $(this).html(new_name);
    $(this).attr('href', new_href);
    $(this).attr('title', new_title);

    if (href.indexOf('/pin') != -1) {
      $(this).parents('section').parents('li').addClass('pinned');
    } else if (href.indexOf('/unpin') != -1) {
      $(this).parents('section').parents('li').removeClass('pinned');
    } 
    
    
    if (href.indexOf('/like') != -1) {
      likes = $(this).next('span.likes');
      counter_id = '#' + likes.children('span.counter').attr('id');
      incr(counter_id, 1);
      
      if ($(counter_id).html() != '0') {
        likes.removeClass('hidden');
      } else {
        likes.addClass('hidden');
      }

    } else if (href.indexOf('/unlike') != -1) {
      likes = $(this).next('span.likes');
      counter_id = '#' + likes.children('span.counter').attr('id');
      incr(counter_id, -1);
      
      if ($(counter_id).html() != '0') {
        likes.removeClass('hidden');
      } else {
        likes.addClass('hidden');
      }
    }

    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: href,
      success: function(resp) {
        return false;
      }
    });

    return false;
  });

  $('#body, #overlay').on("click", 'a.next', function() {
    $('span.loading', this).css('display', 'inline-block');
    $('span.text', this).html('Loading...');
    var more_button = $(this).parents('li');
    console.log('more button clicked');
    $.global.loading = true;
    $.ajax({
      type: "OPTIONS",
      cache: false,
      url: $(this).attr('href'),
      dataType: "html",
      success: function(html) {
        $.global.loading = false;
        more_button.replaceWith(html);
        refresh('#body');
        refresh('#overlay');
      }
    });
    return false;
  });

  $('#popup').on('click', 'a.add-member', function() {
    var element = $(this);
    var href = $(this).attr('href');
    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: href,
      success: function(resp) {
        console.log('Added');
      }
    });
    href = href.replace('/remove_member', '/add_member');
    element.replaceWith('<a href="' + href + '" class="button remove-member">Remove from Group</a>');
    return false;
  });
  
  
  $('#popup').on('click', 'a.invite', function() {
    var element = $(this);
    var href = $(this).attr('href');
    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: href,
      success: function(resp) {
        console.log('Invited');
      }
    });
    
    element.replaceWith('<a href="#" class="button"> ✔ Sent</a>');
    return false;
  });

  $('#body, #overlay, #popup').on('click', 'a.follow', function() {
    var element = $(this);
    var href = $(this).attr('href');
    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: href,
      success: function(resp) {
        console.log('Followed');
      }
    });
    href = href.replace('/follow', '/unfollow');
    
    if (window.location.href.indexOf('/group/') != -1) {
        element.replaceWith('<a href="' + href + '" class="button unfollow">Unfollow</a>');
    }
    else {  // user page
      
      if ($(this).parents('#right-sidebar').length > 0) {
        element.replaceWith('<a href="' + href + '" class="unfollow">- Remove Contact</a>');
      } else {
        element.replaceWith('<a href="' + href + '" class="button unfollow">Remove from Contacts</a>');
      }
    }
    return false;
  });

  $('#body, #overlay, #popup').on('click', 'a.unfollow', function() {
    var element = $(this);
    var href = $(this).attr('href');
    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: href,
      success: function(resp) {
        console.log('Unfollowed');
      }
    });
    href = href.replace('/unfollow', '/follow');
    
    
    if (window.location.href.indexOf('/group/') != -1) {
      element.replaceWith('<a href="' + href + '" class="button follow">Follow</a>');
    } else {
      if ($(this).parents('#right-sidebar').length > 0) {
        element.replaceWith('<a href="' + href + '" class="follow">+ Add Contact</a>');
      } else {
        element.replaceWith('<a href="' + href + '" class="button follow">Add to Contacts</a>');
      }
    }
    return false;
  });

  $('div#body').on('click', 'a.unread-posts', function() {
    $('ul#stream > li.hidden').removeClass('hidden').fadeIn();
    $('div#unread-messages').hide();
    $('div#unread-messages span#unread').html('0');
    return false;
  })

  $('#overlay').on("submit", 'form#profile-update', function() {
    $.ajax({
      type: "POST",
      cache: false,
      url: $(this).attr('action'),
      data: $(this).serializeArray(),
      success: function(resp) {
        if (resp == "Error") {
          show_error()
        } else {
          window.location.href = window.location.pathname;
        }
        return false;
      }
    });
    return false;
  });
  
    $('#popup').on("submit", 'form.new-group', function() {
    $.ajax({
      type: "POST",
      cache: false,
      url: $(this).attr('action'),
      data: $(this).serializeArray(),
      success: function(group_id) {
        open_in_async_mode('/group/' + group_id, null, null, function() {
          open_in_popup_mode('/search?query=&type=people&ref=group-' + group_id);
        });
        
        return false;
      }
    });
    return false;
  });
  
  


  $('#body, #overlay, #popup').on("submit", 'form.new:not(.overlay)', function() {
    button = $('input[type="submit"]', this);
    button.val('Posting...');

    var form = $(this);

    show_loading();
        
    $('span.empty').remove();

    if ($('textarea.mention', form).length != 0) {
      $('textarea.mention', form).mentionsInput('val', function(text) {
        $('form.new textarea.marked-up').val(text);
      });
    }

    // clear autosave form
    if (window.location.href.indexOf('#!') != -1) {
      url = window.location.hash;
    } else {
      url = window.location.href;
    }
    $.global.clear_autosave[url] = $(this).attr('id');

    // clear preload
    $.global.preload = null;

    $('textarea.mention', form).val('').focus();

    // Reset autocomplete
    $('textarea.mention', form).mentionsInput('reset');
    // $('input.autocomplete').tokenInput('clear');

    // Unfocus input autocomplete
    $('input.autocomplete', form).blur();

    // Reset attachments container
    $('div#attachments', form).empty();

    $("textarea", form).css('height', 'auto');

    $.ajax({
      type: "POST",
      cache: false,
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: $(this).attr('action'),
      data: $(this).serializeArray(),
      error: function(jqXHR, textStatus, errorThrown) {
        show_error();
      },
      success: function(resp) {

        button.val('Share');
        hide_loading();

        feed_id = $(resp).attr('id');
          
        if ($('#popup').is(':visible')) {
          open_in_async_mode('/feed/' + feed_id.split('-')[1]);
        } else {
          if ($('#' + feed_id).length == 0) {
            $('ul#stream').prepend(resp);
          }
  
          feed_id = $('ul#stream li.feed').attr('id');
          refresh('ul#stream #' + feed_id);
        }
      }
    });
    return false;
  });
  
  
  
    
  $('#body, #overlay').on('click', 'a.update-comment', function() {
    // Hủy bỏ tất cả các comment đang edit
    $('li.comment div.update-comment').addClass('hidden');
    $('li.comment div.message').removeClass('hidden')
    $('li.comment div.footer').removeClass('hidden');
    $('li.comment a.update-comment.hidden').removeClass('hidden');
    $('li.comment div.update-comment textarea.mention').mentionsInput("reset");
    
    // 
    $(this).addClass('hidden');
    
    comment_id = $(this).parents('li.comment').attr('id');
    
    update_form = $('#' + comment_id + ' div.update-comment')
    if (update_form.is(':visible')) {
      
      update_form.addClass('hidden');
      $('#' + comment_id + ' div.message').removeClass('hidden')
      $('#' + comment_id + ' div.footer').removeClass('hidden');
    }
    
    else {
      update_form.removeClass('hidden');
      $('#' + comment_id + ' div.message').addClass('hidden')
      $('#' + comment_id + ' div.footer').addClass('hidden');
      text = $('#' + comment_id + ' textarea[name="message"]').data('prefill');
      $('#' + comment_id + ' textarea._elastic').val(text);
    }
    
    $('textarea.mention', update_form).mentionsInput("update");
    $('textarea.mention', update_form).focus();
  })
  
  
  $('#body, #overlay').on('submit', 'div.update-comment form', function() {
    
    var comment_id = $(this).parents('li.comment').attr('id');
    
    $('textarea.mention', this).mentionsInput('val', function(text) {
      $('#' + comment_id + ' form.update-comment textarea.marked-up').val(text);
    });
    
    var textarea = $('textarea.mention', this);
    textarea.css('background', '#f1f1f1');
    textarea.attr('readonly', 'readonly');
    
    
    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: $(this).attr('action'),
      data: $(this).serializeArray(),
      error: function(jqXHR, textStatus, errorThrown) {
        textarea.attr("readonly", false);
        textarea.attr('background', '#fff');
      },
      success: function(text) {
        
        textarea.attr("readonly", false);
        textarea.attr('background', '#fff');
        
        $('#' + comment_id + ' div.message .text').html(text);
        $('#' + comment_id + ' div.update-comment textarea[name="message"]').data('prefill', text);
        
        $('#' + comment_id + ' div.update-comment').addClass('hidden');
        $('#' + comment_id + ' a.update-comment').removeClass('hidden');
        $('#' + comment_id + ' div.message').removeClass('hidden')
        $('#' + comment_id + ' div.footer').removeClass('hidden')
        
      }
    })    
    
    return false;
    
    
  })
  
  
  
  $('#body, #overlay').on('keydown', 'form.new-comment textarea, form.update-comment textarea', function(e) {
    if (e.keyCode == 13) {    // Enter
        if (e.ctrlKey || e.shiftKey) {
            var val = this.value;
            if (typeof this.selectionStart == "number" && typeof this.selectionEnd == "number") {
                var start = this.selectionStart;
                this.value = val.slice(0, start) + "\n" + val.slice(this.selectionEnd);
                this.selectionStart = this.selectionEnd = start + 1;
            } else if (document.selection && document.selection.createRange) {
                this.focus();
                var range = document.selection.createRange();
                range.text = "\r\n";
                range.collapse(false);
                range.select();
            }
            $(this).trigger('change'); // update textarea height
        }
        else {
          
          new_comment_form = $(this).parents('form');

          var ts = Math.round((new Date()).getTime() / 1000);

          if (new_comment_form.data('last_submited') === undefined || 
              ts - new_comment_form.data('last_submited') > 1) {
           
            new_comment_form.data('last_submited', ts);
            new_comment_form.trigger('submit');  
          }
          
        }
        return false;
    } 
    
    else if (e.keyCode == 27) {   // ESC
      var comment_id = $(this).parents('li.comment').attr('id'); 
      if ($('#' + comment_id + ' div.update-comment').length > 0) {
        $('#' + comment_id + ' div.update-comment').addClass('hidden');
        $('#' + comment_id + ' a.update-comment').removeClass('hidden');
        $('#' + comment_id + ' div.message').removeClass('hidden')
        $('#' + comment_id + ' div.footer').removeClass('hidden')
        
      }
      
      
    }
  });

  $("#body, #overlay").on("submit", 'form.new-comment', function() {
  
    
    var submit_button = $('input[type="submit"]', this);
    var submit_button_text = submit_button.val();
    submit_button.val('...');
    submit_button.attr('disabled', 'disabled');
    
    var textarea = $('textarea.mention', this);
    textarea.css('background', '#f1f1f1');
    textarea.attr('readonly', 'readonly');
    
    comments_list_id = $(this).parents('ul.comments').attr('id');

    var feed_id = $(this).parents('li.feed').attr('id');
    $.global.disable_realtime_update = feed_id;
    console.log('disable realtime update: ' + feed_id);

    $('textarea.mention', this).mentionsInput('val', function(text) {
      $('#' + feed_id + ' form.new-comment textarea.marked-up').val(text);
    });

    // clear autosave form
    if (window.location.href.indexOf('#!') != -1) {
      url = window.location.hash;
    } else {
      url = window.location.href;
    }
    $.global.clear_autosave[url] = $(this).attr('id');

    // clear preload
    $.global.preload = null;

    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: $(this).attr('action'),
      data: $(this).serializeArray(),
      error: function(jqXHR, textStatus, errorThrown) {
        show_error();
        
        submit_button.val(submit_button_text);
        submit_button.attr('disabled', false);
        textarea.attr("readonly", false);
        textarea.css('background', '#fff');
      },
      success: function(resp) {
        // var offset_top = null;
        // var last_comment = $('#' + feed_id + ' li.comment:last');
//         
        // if (last_comment.length == 0) {
          // if ($('#' + feed_id).length != 0) {
            // offset_top = $('#' + feed_id).offset().top
          // }
//           
        // } else {
          // offset_top = last_comment.offset().top
        // }
//         
        // if (offset_top != null) {
          // $('body').scrollTop(offset_top - 250);
        // }
        
        
        submit_button.val(submit_button_text);
        submit_button.attr('disabled', false);
        textarea.attr("readonly", false);
        textarea.css('background', '#fff');
        
        // remove read-receipts
        // $('#body #' + feed_id + ' a.quick-stats .receipt-icon').remove();
        // $('#body #' + feed_id + ' a.quick-stats .read-receipts-count').remove();
        // $('#body #' + feed_id + ' li.read-receipts').html('<i class="receipt-icon"></i> Seen by no one.');

        // $('#overlay #' + feed_id + ' a.quick-stats .receipt-icon').remove();
        // $('#overlay #' + feed_id + ' a.quick-stats .read-receipts-count').remove();
        // $('#overlay #' + feed_id + ' li.read-receipts').html('<i class="receipt-icon"></i> Seen by no one.');

        // Clear and reset comment box
        $('#' + comments_list_id + " form.new-comment input[name='reply_to']").val('');
        $('#' + comments_list_id + " form.new-comment textarea.mention").val('').focus();
        $('#' + comments_list_id + " form.new-comment textarea.mention").css('height', '26px');
        // reset textarea height

        $('#' + comments_list_id + ' form.new-comment div.attachments').empty();
        $('#' + comments_list_id + ' form.new-comment input[name="attachments"]').val('');

        var comment = $(resp);
        if ($('#' + comment.attr('id')).length == 0) {
          $('#' + comments_list_id + ' div.comments-list').append(resp);

          incr('#body #' + feed_id + ' .quick-stats .comment-count', 1);
          incr('#body #' + feed_id + ' .comments-list .comment-count', 1);
          incr('#overlay #' + feed_id + ' .quick-stats .comment-count', 1);
          incr('#overlay #' + feed_id + ' .comments-list .comment-count', 1);

          refresh('#' + comments_list_id);
        }
      }
    })


    return false;
  });

  $("#body, #overlay").on("click", 'a.toggle-comments', function(e) {
    comments = $('ul.comments', $(this).parents('footer'));
    comments.toggle();
    return false;
  });


  $("#body, #overlay").on("click", 'a.reply', function(e) {

    console.log('a.reply clicked');
    
    // Phải dùng attr(data-) vì comment_id là số quá to, .data() nó parse ra số -> sai mất
    comment_id = $(this).attr('data-comment-id')
    username = $(this).data('owner-name');
    user_id = $(this).attr('data-owner-id');
    if (user_id) {
      comments_list = $(this).parents('ul.comments:first');
    } else {
      comments_list = $('ul.comments', $(this).parents('footer'));
    }

    if (!comments_list.is(":visible")) {
      comments_list.toggle();
    }
    
    mention_textarea = $('li.new-comment textarea.mention', comments_list)
    mention_textarea.mentionsInput('reset');
    
    $('li.write-a-comment', comments_list).remove();
    
    $('li.new-comment', comments_list).show();
    mention_textarea.focus();
    if (username) {
      
      var marked_up_text = '@[' + username + '](user:' + user_id + ')'
      mention_textarea.val(marked_up_text);
      mention_textarea.mentionsInput("update");
      
      $('li.new-comment input[name="reply_to"]', comments_list).val(comment_id);
      
      mention_textarea.val(mention_textarea.val() + ': ');
      
      
    } else {
      mention_textarea.caretToEnd();
    }
    // $('li.new-comment textarea', comments_list).elastic();
    mention_textarea.css('height', '26px');

    preload_autocomplete();
    
    return false;
  });
  
  
  $('#body, #overlay').on('click', 'li.comment a.see-changes', function() {
    
    comment_id = $(this).parents('li.comment').attr('id');
    
    $('#' + comment_id + ' .text').toggleClass('hidden');
    
    
    $('div.tipsy').remove();
    
  })


  $('#body, #overlay').on('click', 'a.remove-comment', function() {
    var r = confirm("Delete this comment?");
    if (r == true) {
    
        comment_id = $(this).parents('li').attr('id');
        $('#body #' + comment_id).fadeOut().remove();
        $('#overlay #' + comment_id).fadeOut().remove();
    
        $.ajax({
          type: "POST",
          headers: {
            'X-CSRFToken': get_cookie('_csrf_token')
          },
          url: $(this).attr('href')
        })
    }
  

    return false;
  })

  $("#body, #overlay").on("click", 'a.mark', function(e) {
    // $.global.mouse_inside_overlay = false;
    $('html').trigger('click');
    count = $(this).data('count');
    counter_id = $(this).data('counter-id');
    if (count) {
      count = parseInt(count);
    } else {
      count = 0;
    }

    var feed_id = $(this).parents('section').parents('li').attr('id');
    $('#body #' + feed_id).fadeOut().remove();
    $('#overlay #' + feed_id).fadeOut().remove();

    incr('#' + counter_id, count);

    // Send request to server (in background)
    var href = $(this).attr('href');
    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: href
    })

    return false;
  });
  

  $("nav").on("click", 'a.notification', function(e) {
    try {
      href = $(this).attr('href').split('#!')[1];
      redirect_to = href.split('?')[1].split('=')[1];
      $(this).removeClass('unread');
    } catch (err) {// mark all as read: close overlay and reset counter
      $.ajax({
        type: "GET",
        url: $(this).attr('href')
      })
      $('#unread-notification-counter').html('0');
      $('#unread-notification-counter').fadeOut('fast');
      $('#unread-notification-counter').addClass('grey');
      
      $('ul.notifications a.unread').removeClass('unread');
      
      var title = document.title;
      var pattern = /^\(.*?\) /gi;
      var count = title.match(pattern);
      document.title = title.replace(count, '');
      
      // $.global.mouse_inside_overlay = false;

      // $('header nav ul.dropdown-menu').addClass('hidden');
      // $('header nav .dropdown-menu-active').removeClass('dropdown-menu-active');
      
      return false;
    }

    open_in_async_mode(redirect_to);

    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: href,
      success: function(count) {
        $('#unread-notification-counter').html(count);
          
        title = document.title;
        var pattern = /^\(.*?\) /gi;
        var counter = title.match(pattern);
        if (count == '0') {
          $('#unread-notification-counter').addClass('grey');
          document.title = title.replace(counter, '');
        } else {
          document.title = title.replace(counter, '(' + count + ') ');
        }
      }
    })
    return false;
  });

  $("#body, #overlay").on("click", 'a.remove-attachment', function() {
    console.log('remove-attachment clicked');
    form = $(this).parents('form');
    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: $(this).attr("data-href"),
      success: function(id) {
        $('#attachment-' + id).remove();
        var files = $('input[name="attachments"]', form).val();
        files = files.replace(id + ',', '');
        $('input[name="attachments"]', form).val(files);
      }
    });
    return false;
  });


  /* ========================= End Message Actions ====================== */

  /**
   * Expand menu (left sidebar)
   */

  $("div#global").on("click", 'a.async', function() {
    
    if ($(this).hasClass('active') && $("#overlay").is(":visible")) {
      close_overlay();
      return false;
    }

    $('#left-sidebar li a.active').removeClass('active');
    
    $(this).addClass('active');
    
    $('.count', $(this)).fadeOut().remove();
    
    var href = $(this).attr('href');
    
    var rel = $(this).attr('rel');

    open_in_async_mode(href, rel);

    // Hide left sidebar (if is openned)
    $('#global, #main').removeClass('global-default-styles');
    $('#left-sidebar').removeClass('left-sidebar-default-styles');

    return false;

  });

  // $('textarea.mention').keyup(function(e) {
    // if (e.keyCode == 27) {
      // // ESC close mentions autocomplete list
      // $('div.mentions-autocomplete-list').empty().hide();
//       
//      
    // }
  // });

  // ============ Search box =============


  $('form#search-box').on('click', '.reset', function() {
    $(this).fadeOut(100);
    $('form#search-box input').val('');
    $('form#search-box input').focus();
    $('form#search-box ul.dropdown-menu').hide();
    return false;
  });

  $('form#search-box input').focus(function(e) {
    show_searchbox_dropdown($(this).val());
    $(this).addClass('highlight');
    $("form#search-box i.search-icon").addClass("highlight");
    if ($('form#search-box input').val().length > 0) {
      $('form#search-box .reset').show();
    }
  });

  var typing_timer;
  $('form#search-box input[name="query"]').keyup(function(e) {
    if (e.keyCode != 27) {// not esc
      query = $(this).val();
      
      if (e.keyCode == 40) { // down
          var selected = $("form#search-box .dropdown-menu a.selected"); 
          if (selected.length == 0) {
            $("form#search-box .dropdown-menu li:first a").addClass('selected');
          } else {
            selected.removeClass("selected");

            if (selected.parent().next().length == 0) {
                selected.parents('ul').children('li').first().children().addClass("selected");
            } else {
                selected.parent().next().children().addClass("selected");
            }        
          }
          return false;
      } else if (e.keyCode === 38) {  // up
          var selected = $("form#search-box .dropdown-menu a.selected");  
          if (selected.length == 0) {
            $("form#search-box .dropdown-menu li:last a").addClass('selected');
          }
          selected.removeClass("selected");
          if (selected.parent().prev().length == 0) {
              selected.parents('ul').children('li').last().children().addClass("selected");
          } else {
              selected.parent().prev().children().addClass("selected");
          }
          return false;
      } else {      
        if (query != '') {
          show_searchbox_dropdown(query);
        } else {
          $('form#search-box ul.dropdown-menu').hide();
          $('form#search-box .reset').hide();
          $('form#search-box .spinner').hide();
          return false;
        }

      }


      if (query.length >= 1) {

        if (e.keyCode != 13) {
          typing_timer = setTimeout(function() {
            // preload result
            var url = $('form#search-box').attr('action');
            query = $('form#search-box input[name="query"]').val();
            url = url + '?query=' + query;

            try {
              $.global.preload_request.abort();
            } catch (err) {
            }

            $.global.preloading = query;
            $.global.preload_request = $.ajax({
              type: "OPTIONS",
              url: url,
              cache: true,
              headers: {
                'X-CSRFToken': get_cookie('_csrf_token')
              },
              dataType: "json",
              success: function(resp) {
                if ( typeof $.global.preload == 'undefined' || $.global.preload == null) {
                  $.global.preload = {};
                }

                $.global.preload[query] = resp;
                if ($.global.preload_show_results == true) {
                  $.global.preload_show_results = false;
                  show_results(resp);
                }

              }
            });

          }, 300);
        }
        
        else { // enter key pressed
          console.log('enter key pressed')
          return false;
        }
      }
    } 
  });

  $('form#search-box input[name="query"]').keydown(function(e) {
    clearTimeout(typing_timer);
  });

  function show_results(resp) {
    
    hide_searchbox_dropdown();
        
    hide_loading();

    if (resp.title) {
      $.global.title = document.title;
      update_title(resp.title);
    }

    if (!$.global.body) {
      $.global.body = $("#body").html();
      $.global.scroll = $("body").scrollTop();
      console.log($.global.scroll);
    }

    // $("#left-sidebar").hide();
    $("#body").hide();
    if (resp.body) {
      // resp.body += "<a id='close' class='close-icon' onclick='close_overlay();'></a>";
      $('div#overlay').html(resp.body);
    } else {
      // resp += "<a id='close' class='close-icon' onclick='close_overlay();'></a>";
      $('div#overlay').html(resp);
    }

    $('div#overlay').show();
    $.global.scroll = $("body").scrollTop();

    $('body').animate({
      scrollTop: 0
    }, 'fast');

    refresh('div#overlay');
  }


  $("header nav").on('submit', 'form#search-box', function() {
    $("form#search-box input[name='query']").blur();
    hide_searchbox_dropdown();
    
    var selected = $("form#search-box .dropdown-menu a.selected"); 
    if (selected.length != 0 && selected.attr('href').indexOf('/search?query=') == -1) {
      selected.trigger('click');
      return false;
    }
  

    var url = $(this).attr('action');
    var query = $('input[name="query"]', this).val();

    if ( typeof $.global.preload == 'undefined' || $.global.preload == null) {
      $.global.preload = {};
    }

    if ($.global.preload[query] != null) {
      show_results($.global.preload[query]);
    } else if ($.global.preloading == query) {
      console.log('wait preload results...');
      $.global.preload_show_results = true;
      show_loading();
    } else {
      show_loading();
      href = url + '?query=' + query;

      // try {
      // $.global.search.abort();
      // } catch (err) {}
      $.global.search = $.ajax({
        type: "OPTIONS",
        cache: true,
        dataType: 'json',
        url: href,
        headers: {
          'X-CSRFToken': get_cookie('_csrf_token')
        },
        error: function(jqXHR, textStatus, errorThrown) {
          show_error();
          hide_loading();
        },
        success: function(resp) {    
          hide_loading();      
          href = '#!' + href;

          if ($.global.history.length == 10) {
            key = $.global.history.pop();
            sessionStorage.removeItem(key);
            console.log('Remove ' + key + ' from Session Storage');
          }

          sessionStorage[href] = JSON.stringify(resp);
          // save to session storage (for Back button)
          $.global.history.unshift(href);

          history.pushState({
            rel: null,
            path: href
          }, 'Jupo', href);

          show_results(resp);
          return false;

        }
      })

    }
    return false;
  });

  // =========== End search box ===========

  $('#overlay').on("submit", 'form.overlay', function() {
    var submit_button = $('input[type="submit"]', this);
    var submit_button_text = submit_button.val();
    submit_button.val('...');
    submit_button.attr('disabled', 'disabled');
    show_loading();

    $('textarea.mention', this).mentionsInput('val', function(text) {
      $('form.new textarea.marked-up').val(text);
    });

    $.ajax({
      type: "POST",
      cache: false,
      url: $(this).attr('action'),
      data: $(this).serializeArray(),
      dataType: "json",
      success: function(resp) {
        hide_loading();

        submit_button.val(submit_button_text);
        submit_button.attr('disabled', false);

        console.log(resp);
        
        if (resp.redirect != undefined) {
          open_in_async_mode(resp.redirect);
          return false;
        }
        
        
        // Reload body
        // if (resp.reload == true) {
          // url = window.location.href;
          // $.ajax({
            // type: "POST",
            // url: url,
            // dataType: "json",
            // success: function(resp) {
              // console.log('reloaded');
              // $.global.body = resp.body;
              // $("#body").html(resp.body);
              // $.global.scroll = $("body").scrollTop();
              // refresh('div#body');
            // }
          // });
        // }
// 
        // if (!$.global.body) {
          // $.global.body = $("#body").html();
          // $.global.scroll = $("body").scrollTop();
          // console.log($.global.scroll);
          // // console.log($.global.body);
        // }
// 
        // // $("#left-sidebar").hide();
        // $("#body").hide();
        // if (resp.body) {
          // $('div#overlay').html(resp.body);
        // } else {
          // $('div#overlay').html(resp);
        // }
        // ;
        // $('div#overlay').show();
        // $.global.scroll = $("body").scrollTop();
// 
        // $('body').animate({
          // scrollTop: 0
        // }, 'fast');
// 
        // refresh('div#overlay');

      }
    });
    return false;
  });

  $("div#global").on("click", 'a.overlay', function() {
    var href = $(this).attr('href');
    console.log('overlay clicked: ' + href);
    open_in_overlay_mode(href);

    // Hide left sidebar (if is openned)
    $('#global, #main').removeClass('global-default-styles');
    $('#left-sidebar').removeClass('left-sidebar-default-styles');

    return false;
  });
  
  $("div#global").on("click", 'a.popup', function() {
    var href = $(this).attr('href');
    open_in_popup_mode(href);
    return false;
  });

  // $.global.mouse_inside_overlay = false;

  // $('div#main').on('mouseenter', '#overlay', function() {
    // // var hint = $('span#hint');
    // // $.global.mouse_inside_overlay = true;
// 
    // // if(hint.hasClass('mouse-click')) {
    // // hint.removeClass('mouse-click');
    // // hint.addClass('esc');
    // // hint.html('Press ESC to close');
    // // }
  // })

  // $('div#main').on('mouseleave', '#overlay', function() {
    // // var hint = $('span#hint');
    // // $.global.mouse_inside_overlay = false;
// 
    // // if(!hint.hasClass('mouse-click')) {
    // // hint.html('Press ESC or left mouse button to close');
    // // hint.addClass('mouse-click');
    // // hint.addClass('esc');
    // // }
  // })
  // $('div#overlay').on('mouseover mouseout', function(e) {
  // var hint = $('span#hint');
  //
  // if(e.type == 'mouseover') {
  // $.global.mouse_inside_overlay = true;
  //
  // if(hint.hasClass('mouse-click')) {
  // hint.removeClass('mouse-click');
  // hint.addClass('esc');
  // hint.html('Press ESC to close');
  // }
  //
  // } else {
  // $.global.mouse_inside_overlay = false;
  //
  // if(!hint.hasClass('mouse-click')) {
  // hint.html('Press ESC or left mouse button to close');
  // hint.addClass('mouse-click');
  // hint.addClass('esc');
  // }
  // }
  // });

  // $("body").on('click', '#scroll-to-top, form#search-box input', function() {
    // if ($('#overlay').is(":visible")) {
      // // $.global.mouse_inside_overlay = true;
    // }
  // })

  $('html').on('click', function(e) {
    console.log(e)
    
   

    // Scroll to Top
    // if (e.target.id == 'header-container' || e.target.id == 'top-panel-bg') {
      // $('body').animate({
        // scrollTop: 0
      // }, 'fast');
    // }

    // TODO: disable text selection on double click on whitespace area

    if (e.target.name != 'query' && !$('div#overlay').is(":visible")) {
      hide_searchbox_dropdown();
    } 
    
    if (e.target.className == 'background' && $('#popup').is(':visible')) {
      close_popup();
    }

    if (e.target.name != 'query') {
      hide_searchbox_dropdown();
    }

    // Hide left sidebar (if is openned)
    if (e.target.className != 'menu-icon') {
      $('#global, #main').removeClass('global-default-styles');
      $('#left-sidebar').removeClass('left-sidebar-default-styles');
    }

    $('div#filters > ul').hide();


    $('a.dropdown-menu-icon.active').parent().removeClass('active');
    $('a.dropdown-menu-icon.active').next('ul').hide();
    $('a.dropdown-menu-icon.active').removeClass('active');


    $('header nav ul.dropdown-menu').addClass('hidden');
    $('header nav .dropdown-menu-active').removeClass('dropdown-menu-active');
    
    // if (!$.global.mouse_inside_overlay && !$('#body').is(":visible") && e.target.nodeName != 'SELECT') {
// 
      // close_overlay();
// 
      // // refresh();
    // }
  });

  $("#body, #overlay").on('click', 'a.see-more', function() {
    $(this).prev('div').hide();
    $(this).next('div.hidden').show();
    $(this).hide();
  })

  $("#body, #overlay").on("click", '.current', function() {
    $(".current ul").remove();
    $(".current").addClass("async");
    $(".current").removeClass("current");

  });

  $("body").on('submit', "#subscription", function() {
    $.ajax({
      type: "POST",
      url: '/notify_me',
      data: $(this).serializeArray(),
    });

    $('div#footer').fadeOut(0);
    $('div#intro h1').fadeOut(0, function() {
      $('div#intro h1').html('Thanks!').fadeIn('fast');
    });
    $('div.info').fadeOut(0, function() {
      $('div.info').html("You're now in the waiting list.<br>We'll email you when Jupo is ready.").fadeIn(3000);
    });
    return false;
  })
  // Invite form
  // $('#body').on('submit', 'form#invite', function() {
    // var msg = $('span', this);
    // var input = $('input[name="email"]', this);
    // $.ajax({
      // type: "POST",
      // url: $(this).attr('action'),
      // data: $(this).serializeArray(),
      // success: function(message) {
        // msg.html(message);
        // input.val('').focus();
      // }
    // });
    // return false;
  // })

  // $('#body').on('keyup', 'form#invite input[name="email"]', function() {
    // var email = $(this).val();
    // if (email != '') {
      // $('form#invite span').html('Press Enter to send invitation.');
    // }
  // })
// 
  // $('#body').on('blur', 'form#invite input[name="email"]', function() {
    // $('form#invite span').html('&nbsp;');
  // })
  
  /* Auto perform ajax request */
  if (window.location.hash.indexOf('#!') != -1) {
    open_in_overlay_mode(window.location.hash);
  }

  // $("#body, #overlay").on("keydown", "form.new-comment textarea.mention",
  // function(e) {
  //
  // if (e.keyCode == 13) {
  // if (e.ctrlKey) {
  // var val = this.value;
  // if (typeof this.selectionStart == "number" && typeof this.selectionEnd ==
  // "number") {
  // var start = this.selectionStart;
  // this.value = val.slice(0, start) + "\n" + val.slice(this.selectionEnd);
  // this.selectionStart = this.selectionEnd = start + 1;
  // } else if (document.selection && document.selection.createRange) {
  // this.focus();
  // var range = document.selection.createRange();
  // range.text = "\r\n";
  // range.collapse(false);
  // range.select();
  // }
  // $(this).elastic();
  // }
  // else if (!e.ctrlKey && !e.altKey) {
  // console.log('Enter pressed');
  // $('input[type="submit"]', $(this).parents('form')).trigger('click');
  // }
  // return false;
  // }
  // });

  /* Quick reply mode handler */
  // $('#body, #overlay').on("keydown", 'form.new-comment textarea.mention',
  // function(e) {
  // if(e.keyCode == 13) {
  // item_id = $(this).parents('ul.comments').attr('id').replace('-comments',
  // '');
  // if($('div#overlay').is(':visible')) {
  // if($('div#overlay #' + item_id + ' form.new-comment
  // input[type=checkbox]').is(':checked') == true) {
  // $('#' + item_id + ' form.new-comment').trigger('submit');
  // return false;
  // }
  // } else {
  //
  // if($('div#body #' + item_id + ' form.new-comment
  // input[type=checkbox]').is(':checked') == true) {
  // $('#' + item_id + ' form.new-comment').trigger('submit');
  // return false;
  // }
  // }
  // }
  //
  // });

  $('#body, #overlay').on('focus', 'form.new:not(.doc.overlay) textarea', function() {
    
    $('form.new:not(.doc.overlay) textarea').elastic();

    // $('form.new table').css('border-bottom', '1px solid #E6E6E6');
    $('footer').show();
    // show form footer (buttons)

    if ((window.location.pathname.indexOf('/user/') == -1) && $('form.new a.active').length == 0) {
      // $('form.new a#send-to').trigger('click');
      $('form.new a#send-to').addClass('active');
      $('form.new tr#send-to').show();
    } else if (window.location.pathname.indexOf('files') != -1 && $('form.new a.active').length == 0) {
      $('form.new a#attach').trigger('click');
    }

    preload_autocomplete();

  });

  $('#body').on('change', 'input#show-archived-posts', function() {
    checked = $(this).is(':checked');
    console.log(checked)
    if (checked) {
      set_cookie('show_all', 1);
    } else {
      delete_cookie('show_all');
    }

    $('#left-sidebar li#news-feed > a').trigger('click');
  })

  $('#body').on('click', 'a.archive-from-here', function() {

    var ts = $(this).data('ts').replace(' at ', ' ');
    var r = confirm('Are you sure?\n\n' + 'All posts older than "' + ts + '" will be archived.\n\n' + 'Press OK to continue, or Cancel to go back.');
    if (r == false) {
      $('html').trigger('click');
      return false;
    } else {
      $('html').trigger('click');
      show_loading();
      $.ajax({
        type: "POST",
        headers: {
          'X-CSRFToken': get_cookie('_csrf_token')
        },
        url: $(this).attr('href'),
        success: function(message) {
          hide_loading();
          $('#left-sidebar li#news-feed > a').trigger('click');
        }
      });
      return false;
    }

  })

  $('#body').on('click', 'a.filter', function() {

    // Hide drop menu
    $('a.dropdown-menu-icon.active').parent().removeClass('active');
    $('a.dropdown-menu-icon.active').next('ul').hide();
    $('a.dropdown-menu-icon.active').removeClass('active');

    var ul = $(this).next('ul');
    ul.toggle();
    return false;

  })

  $('#header-container').on('click', 'a#menu-toggle', function() {
    if ($('#left-sidebar').width() <= 0) {
      $('#global, #main').addClass('global-default-styles');
      $('#left-sidebar').addClass('left-sidebar-default-styles');
    } else {
      $('#global, #main').removeClass('global-default-styles');
      $('#left-sidebar').removeClass('left-sidebar-default-styles');
    }
  })
  
  
  
  
  
  
  
  
  $('#body, #overlay').on('click', 'a.view-previous-comments', function() {
    
    var _this = $(this);
    var post_id = _this.parents('li.feed').attr('id');
    
    // Show preloaded comments
    $('#' + post_id + ' ul.comments li.comment.hidden').removeClass('hidden');
    
    var displayed_count = $('#' + post_id + ' ul.comments li.comment:not(.hidden)').length;
    $('.displayed-count', _this).html(displayed_count);
    
    var undisplayed_count = $('.comment-count', _this).html() - displayed_count;
    if (undisplayed_count <= 0) {
      _this.parent().remove()
    }
    else if (undisplayed_count > 5) {
      $('text', _this).html('View previous comments');
    } else {
      $('text', _this).html('View ' + undisplayed_count + ' more comments');
    }
    
    // Preload next comments
    if (_this.attr('href') != undefined) {
      $.ajax({
        type: "OPTIONS",
        url: _this.attr('href'),
        dataType: "json",
        success: function(data) {
          
          if (data.next_url < 5) {
            _this.attr('href', '#');
          } else {
            _this.attr('href', data.next_url);
          }
          
          $('.comment-count', _this).html(data.comments_count);
          
          $('#' + post_id + ' ul.comments li.comment:first').before(data.html);
          refresh('#' + post_id + ' ul.comments');
          
          return false;
        }
      });
    }
    
      
    
    return false;
    
  })
  
  
  
  $('#global').on('click', 'a.online-now', function() {
    
    $('ul#friends-online').toggleClass('hidden');
    return false;
    
  })
  
    

  $('#main').on('click', 'a.chat', function() {
    
    var href = $(this).attr('href');
    var user_id = href.split('/')[2];

    if ($('#chat #chat-' + user_id).length > 0) {
      return false;
    }

    show_loading();
    $.get(href, function(html) {
      hide_loading();
      
      box = $(html)
      var box_id = $('.chatbox', box).attr('id')

      if ($('#chat #chat-' + box_id).length == 0) {

        $('#chat').prepend(html);

        $('#chat #' + box_id + ' textarea').focus();
        $('#chat #' + box_id + ' .messages').scrollTop(99999);

      }

    });
    return false;

  })

  
  
  
  
  
  $('#chat').on('click', 'a.close', function() {

    $(this).parents('.inflow').remove();

    return false;

  })
  
  
  
  $('#chat').on('keydown', 'textarea', function(e) {
    if (e.keyCode == 13) {    // Enter
      console.log(e.keyCode)
        if (e.ctrlKey || e.shiftKey) {
            var val = this.value;
            if (typeof this.selectionStart == "number" && typeof this.selectionEnd == "number") {
                var start = this.selectionStart;
                this.value = val.slice(0, start) + "\n" + val.slice(this.selectionEnd);
                this.selectionStart = this.selectionEnd = start + 1;
            } else if (document.selection && document.selection.createRange) {
                this.focus();
                var range = document.selection.createRange();
                range.text = "\r\n";
                range.collapse(false);
                range.select();
            }
            $(this).trigger('change'); // update textarea height
        }
        else {
          
            $(this).parents('form').trigger('submit');  
          
        }
        return false;
    } 
  })
  
  $('#chat').on('submit', '.chatbox form', function() {
    
    var _this = $(this);
    var _boxchat = _this.parents('.chatbox');
    
    $('.status', _boxchat).html('Sending...').fadeIn();
    
    $.ajax({
      type: "POST",
      headers: {
        'X-CSRFToken': get_cookie('_csrf_token')
      },
      url: $(this).attr('action'),
      data: $(this).serializeArray(),
      success: function(html) {
        
        $('textarea', _this).val('').focus();
        $('.status', _boxchat).fadeOut().html('');
        $('.messages', _boxchat).append(html);
        $('.messages', _boxchat).scrollTop(99999);
        
        
      }
    });
    
    return false;
    
    
  })
  

  
  
  
  
  
  // $('#popup').on('submit', 'form', function() {
    // return false;
  // })
  
  $('#popup').on('keyup', 'form input[name="query"]', function(e) {
    
    if (e.keyCode == 13) {  // Disable enter key
      return false;
    } else if (e.keyCode == 27) {
      close_popup();
      return false;
    }
    
    query = $(this).val();
    url = $(this).parent().attr('action');
    if (query.length > 1) {
      
      if ($.global.people_search_not_found_last_keyword) {
        if (query.indexOf($.global.people_search_not_found_last_keyword) != -1) {
          if (is_valid_email(query)) {
            
            var code = "<li title='" + query + "' class='email'><a class='rfloat button invite' href='/invite?email=" + query;
            
            group_id = window.location.href.split('/group/')[1];
            if (group_id != undefined) {
              code += "&group_id=" + group_id;
            }
            
            code += "'>Send Invite</a><img class='small-avatar lfloat' src='http://5works.s3.amazonaws.com/images/user2.png' /><strong>";
            code += query.split('@')[0] + "</strong><span class='gray'>@" + query.split('@')[1] + "</span></li>";

            $('#popup ul.people').html(code);
            
            
          } else {
            $('#popup ul.people').html($.global.people_search_not_found_last_message);
          }
          return false;
        } else {
          $.global.people_search_not_found_last_keyword = null;
          $.global.people_search_not_found_last_message = null;
        }
      }
      
      try {
        clearTimeout($.global.people_search_timeout)
      } catch (err) {}
      $.global.people_search_timeout= setTimeout(function() {
        
        
        
        
        try {
          $.global.people_search_request.abort();
        } catch (err) {
        }
      
        $.global.people_search_request = $.ajax({
            type: 'POST',
            headers: {
              'X-CSRFToken': get_cookie('_csrf_token')
            },
            url: url + '&query=' + query,
            async: true,
            success: function(resp) {
              $('#popup ul.people').html(resp);
              if (resp.indexOf('@') == -1) {
                $.global.people_search_not_found_last_keyword = query;
                $.global.people_search_not_found_last_message = resp;
              }
            }
         })
        
        
        
        
        
        
        
              
        
      }, 300)
    }
  })
  
  
  
 
});






 