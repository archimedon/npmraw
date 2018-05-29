"use strict";

$(function() {
    // Base Config for hyperLists
    $('.hyper_list').on('change', function (e) {
      if (e.target.classList.contains('hyper_input')) {
        this.querySelectorAll(".hyper_input").forEach( function (curr, index) {
          $(curr).trigger('show');
        })
      }
    }).on('click', function (e) {
      if (e.target.classList.contains('hyper_item')) {
        e.target.querySelector(".hyper_input").click();
      }
    }).on('clear', function (e) {
      if (e.target == this) {
        this.querySelectorAll("input.hyper_input").forEach( function (inpElem, index) {
          switch (inpElem.getAttribute("type")) {
            case 'radio':
            case 'checkbox': {
              inpElem.checked = false;
            }
            break;
            default: {
              inpElem.value='';
            }
          };
          $(inpElem).closest('.hyper_item').trigger('redraw', { state: false })
        });
      }
    });
    $('.hyper_input').on('show', function (e) {
      $(this).closest('.hyper_item').trigger('redraw', { state: this.checked })
    })
    $('.hyper_item').on('redraw', function (e, data) {
       this.classList.toggle("active", data.state)
    });
    // END Base Config

    // Add 'Author' specfic listener
    $('.author_item').on('change', function (e) {
      var loadZone =  $('#author_posts');
      var currUrn = loadZone.data("ref");
      var targetUrn = e.target.id

      if (e.target.checked) {
        loadZone.data("ref", targetUrn ).empty().show().load('/' + targetUrn + '/post');
      }
      else if (currUrn == targetUrn) {
        loadZone.empty().removeData("ref");
      }
    });

    $('#categories').on('reset', function (e) {
      $(this).find(".hyper_list").trigger('clear');
      $(this).hide();
    })
    
    function getOpts() {
      return {
        url: null,
        previewsContainer: ".dropzone-previews",
        autoProcessQueue: false,
        autoQueue: true,
        uploadMultiple: true,
        parallelUploads: 2,
        addRemoveLinks: false,
        maxFiles: 2,
        init: function() {
          var dzClosure = this; // closure

          var submitButton = document.querySelector("#submit")
          submitButton.addEventListener("click", function( event) {
            event.preventDefault();
            event.stopPropagation();
            //- event.stopImmediatePropagation();
            if (dzClosure.getQueuedFiles().length > 0) {
                dzClosure.processQueue();
            } else {
                dzClosure.uploadFiles([{ name: 'nofiles' }]); //send empty
            }
          });

          this.on("completemultiple", function (responseText) {
              console.log('responseText', responseText);
              alert('done');
              dzClosure.removeAllFiles();
              $('#post_block').trigger('finish', dzClosure);
          });

          //send all the form data along with the files:
          this.on("sendingmultiple", function (data, xhr, formData) {
            console.log('sendingmultiple');
            //- console.log('data', data);

            var ary = $("body").find("select, textarea, input:checkbox, input:radio").serializeArray();
            
            $.each(ary, function (i, elem) {
              formData.append(elem.name, elem.value); // Append all the additional input data of your form here!
              console.log('nv', elem);
            })
          });
          // show 'categories' when the required files have been added
          this.on("addedfile", function(file) {
            console.log('file', file);
            if (dzClosure.getQueuedFiles().length >= 1) {
               $('#categories').show();
               $('#submit').show();
            }
          });

          this.on("sending", function(file, xhr, formData) {
            console.log('sending', formData);
          });
        }
      };
    }

    var postBlockForm = new Dropzone("#post_block_form", getOpts());
    postBlockForm.disable()

    $('#author_posts').on('click', '.new_post', function(e) {
      var self = $(this);
      console.log('self.attr("id")', self.attr("id"));
      postBlockForm.options.url = self.attr("id");
      postBlockForm.enable();
      $('#post_block').on('finish', function( event, data) {
        data.disable()
        $(this).hide();
        $('#previewzone').hide();
        $('#categories').trigger('reset');
        $('#submit').hide();
      });
      $('#post_block').show();
      $('#previewzone').show();

      //- console.log('block', $('#post_block_form'))
      //- console.log($('#post_block_form').dropzone)
    });
  });