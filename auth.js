
function api(apiName, data, callback){
    $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        url: "/rec/api/" + apiName,
        timeout: 120000,
        success: callback,
        error: function (data) {
            console.error(data);
           // window.location.href = "https://lifestreams.smalldata.io/hn/";
        }
    });
}