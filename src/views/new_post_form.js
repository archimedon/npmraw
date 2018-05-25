$(function(){
    $('.new_post').click(function(e) {
      var self = $(this);
      e.preventDefault();
      console.log('new_post url', self.attr("id"));
      $('div#post_block').show();
      
      $('div#post_block_form').dropzone({
        url: '/' + self.attr("id"),
        autoProcessQueue: false,
        autoQueue: true,
        uploadMultiple: true,
        accept: function(file, done) {
          console.log('file.name', file.name);
          
          if (file.name.endsWith('.doc')) {
            done("Add Header image");
            $('#categories').show();
          }
          else return false;
          //- else { done(); }
        }
      });
      
    });
  });