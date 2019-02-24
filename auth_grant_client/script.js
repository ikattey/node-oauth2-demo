var authServer = "http://localhost:3000";

var clientId = '35833868-cd34-4991-a422-fe00e87dc6f7';
// DON'T DO THIS! Secret only included as this is a demo
var clientSecret = '029e845c-8077-43da-90a3-db447f26f9e1';
var redirectUri = 'http://localhost:8081';

var refreshToken;

var requestAuthHeader = {
    "Authorization": "Basic " + btoa(clientId + ":" + clientSecret)
}


var codeRequestParams = {
    client_id: clientId,
    redirect_uri: redirectUri,
    state: 'randomStringThatHasNoMeaning',
    response_type: 'code'
};

function parseQueryString() {
    var sPageURL = decodeURIComponent(window.location.search.substring(1));
    var pieces = sPageURL.split("&"), data = {}, i, parts;
    // process each query pair
    for (i = 0; i < pieces.length; i++) {
        parts = pieces[i].split("=");
        if (parts.length < 2) {
            parts.push("");
        }
        data[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    }
    return data;
}

function triggerOauth() {
    window.location.replace(authServer + "/oauth/authorize?" + $.param(codeRequestParams));
}

function showTokenInfo(tokenResponse) {
    if (!$(".oauth").is(":visible")) {
        $(".oauth").show();
    }

    $("#access-token").text(tokenResponse.access_token)
    $("#token-type").text(tokenResponse.token_type)
    $("#expires-in").text(tokenResponse.expires_in)
    $("#refresh-token").text(tokenResponse.refresh_token)
}

function refreshAccessToken() {
    var refreshRequestParams = {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
    };

    $.ajax({
        url: authServer + "/oauth/token",
        type: 'post',
        data: $.param(refreshRequestParams),
        headers: requestAuthHeader,
        dataType: 'json',
        success: function (response) {
            refreshToken = response.refresh_token;
            showTokenInfo(response);
        }
    });
}

function getAccessToken(urlParams) {
    var tokenRequestParams = {
        grant_type: "authorization_code",
        code: urlParams.code,
        redirect_uri: redirectUri
    };

    $.ajax({
        url: authServer + "/oauth/token",
        type: 'post',
        data: $.param(tokenRequestParams),
        headers: requestAuthHeader,
        dataType: 'json',
        success: function (response) {
            refreshToken = response.refresh_token;
            showTokenInfo(response);
        }
    });
}

$(document).ready(function () {
    var urlParams = parseQueryString();
    // if url contains code and state, this page has been loaded after a redirection from the oauth2 server.
    if (urlParams.code && urlParams.state === codeRequestParams.state) {
        $(".login-button").remove();
        history.pushState('', document.title, window.location.pathname);
        getAccessToken(urlParams);
    } else {
        $(".oauth").hide();
    }
});






