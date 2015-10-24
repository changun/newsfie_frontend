function shuffle(array) {
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}

var sessions = shuffle(["medium", "meetup"]);
var data =
{
    medium: [],
    meetup: []
};
var info =
{
    pilot : false,
    startTime: moment().format(),
    sessions: sessions
};
var logs = [];
var settings =
{
    medium: {name: "News Articles", question: "How interesting is this article to you?"},
    meetup: {name: "Meetup Information" , question: "How interesting is this meetup information to you?"}
};
var methodNames = [["ours", "ImmRec"], ["most-popular", "Most Popular"], ["ctr", "CTR"], ["pmf", "CF"], ["random", "Random"]];

var sessionIndex = 0;
var index = 0;
var secondBatchLoaded = false;

var getCurSession = function () {
    return sessions[sessionIndex];
};
var getCurItem = function () {
    return data[getCurSession()][index];
};
var getCurItemSet = function () {
    return data[getCurSession()];
};
var setCurItemSet = function (items) {
    return data[getCurSession()] = items;
};

var logEvent = function (event, val){
    logs.push({
        event:event,
        val:val,
        timestamp: moment().format(),
        itemIndex: index,
        session: getCurSession(),
        secondBatchLoaded: secondBatchLoaded,
        sessionIndex: sessionIndex

    });
};
var loadNextBatch = function (batchId, callback) {
    DOMs.loader.addClass("active");
    logEvent("loadNextBatch", "start");
    $.ajax({
        type: 'POST',
        data: JSON.stringify(
            {
                ignores: getCurItemSet().map(function (s) {
                    return s.id;
                }),
                ratings: getCurItemSet().filter(function (s) {
                    return (s["recommended-by"].length > 1 || s["recommended-by"][0] != "ours")
                            && s.rating;
                }).map(function (s) {
                    return [s.id,  (s.rating-1) * 0.25];
                }),
                count: info.count,
                methods: batchId == 0 ? ["random", "most-popular", "ours"] : ["most-popular", "ours", "ctr", "pmf"]
            }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        url: "/userstudy/rec/api/" + getCurSession() + "-study",
        timeout: 120000,
        success: function (ret) {
            DOMs.loader.removeClass("active");
            logEvent("loadNextBatch", "success");
            ret.forEach(function(e){
                e.batchId = batchId;
            });
            callback(ret);
        },
        error: function (data) {
            console.error(data);
            alert("Something wrong when retrieving items. Please inform the study coordinator!");
            // window.location.href = "https://lifestreams.smalldata.io/hn/";
        }
    });
};
var postLogs =function(callback){
    var myData = {};
    for(var type in data){
        if(data.hasOwnProperty(type)){
            myData[type] = data[type].map(function(item){
                var myItem = jQuery.extend({}, item);
                delete  myItem["content"];
                if(myItem["img"]) {
                    delete  myItem["img"];
                }
                return myItem
            })
        }
    }
    $.ajax({
        type: 'POST',
        data: JSON.stringify(
            {
                data : myData,
                info : info,
                logs : logs
            }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        url: "/userstudy/rec/api/logs",
        timeout: 120000,
        success: function (ret) {
            logEvent("postLogs", "success");
            DOMs.userId.html(ret["user-id"]);
            callback(ret);
        },
        error: function (data) {
            logEvent("postLogs", "error");
            console.error(data);
            alert("Something wrong when posting logs. Please inform the study coordinator!");
            // window.location.href = "https://lifestreams.smalldata.io/hn/";
        }
    })
};

var source   = $("#statsTemp").html();
var template = Handlebars.compile(source);
var showStatistics = function (){
    var scores = {};
    var avg = {};
    for(var s in data){
        if (data.hasOwnProperty(s)) {
            data[s].filter(function (e) {
                return e.rating;
            }).forEach(
                function (e) {
                    e["recommended-by"].forEach(function (m) {
                        if (!scores[s]) {
                            scores[s] = {};
                        }
                        if (scores[s][m]) {
                            scores[s][m].push(e.rating);
                        } else {
                            scores[s][m] = [e.rating];
                        }

                        if(!avg[m]){
                            avg[m] = {};
                        }
                        avg[m][s] = math.mean(scores[s][m]).toFixed(1);
                    });
                });
        }
    }
    console.log(avg);
    DOMs.table.empty();
    methodNames.forEach(function(methodName){
        var name = methodName[0];
        var fullName = methodName[1];
        if (avg.hasOwnProperty(name)) {
            avg[name].name = fullName;
            DOMs.table.append(template(avg[name]));
        }
    });
};

