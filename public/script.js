$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);

  $('#form-signin').submit(function(event) {
    event.preventDefault();
    const data = $('#form-signin').serialize();
    $.post(window.location.origin + '/api/user/login', data)
      .done(function() {
        //send authorization request to backend with url params
        window.location.href = urlParams.get('redirect');
      })
      .fail(function(error) {
        $('#prompt')
          .removeClass()
          .addClass('alert alert-danger')
          .html(error.responseJSON.error);
      });
  });
});
