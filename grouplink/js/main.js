

google.load('visualization', '1', {packages: ['corechart', 'bar']});
var source   = $("#entry-template").html();
var template = Handlebars.compile(source);
var likes = {}, dislikes = {}, shown = {};
var cardContainer = $("#content");
var pref, origPref, titles;
var loadMoreLoader = $("#load-more-loader");
var loader = $(".loader");
var loadMoreDiv = $(".load-more");
var loading = false;
var settingButton = $(".setting.icon");
var banner = $("#banner");
var footer = $("footer");
banner.hide();
footer.hide();
function appendStories (stories){

    stories = stories.filter(function(story){
        return !shown[story.id];
    });
    // generate and append story cards
    var cards = stories.map(
        function(story){
            // create card
            story.description= $("<div>" + story.description +"</div>").text();

            var card = $(template(story));
            // and setup thumb button's click events
            card.click(function(){
                window.open(
                    story.link,
                    '_blank' // <- This is what makes it open in a new window.
                );
            });

            return card;

        });
    cardContainer.append(cards);

    // keep the record of the shown stories
    stories.forEach(
        function(story){
            shown[story.id] = true;
        });
}




function onThumbsClicked (){
    var thumbButton = $(this);
    var id = thumbButton.data("id");

    if($(this).data("preference") == "like"){
        likes[id] = true;
        delete dislikes[id];
        thumbButton.find(".icon").transition('pulse');
    }else{
        dislikes[id] = true;
        delete likes[id];
        // remove the story card
        thumbButton.closest(".card").transition('horizontal flip');
    }
    thumbButton.parent().find(".clicked").removeClass("clicked");
    thumbButton.addClass("clicked");

}
function showPreferences(){
    function drawPref(title) {
        var data = pref.map(function(p, index){
            var origP = origPref[index];
            var title = titles[index];
            title = title.split(",").slice(0, 3).join(",");
            return [title, origP, (p - origP)];
        });
        data.sort(function(a, b) {
            return parseFloat(b[1]) - parseFloat(a[1]);
        });
        data = data.slice(0,25);
        data = [["Topic", "Initial", "Offset"]].concat(data);
        data = google.visualization.arrayToDataTable(data);

        var options = {
            title: title,
            chartArea: {width: '60%', height:'85%'},
            hAxis: {
                title: 'Weight'
            },
            vAxis: {
                title: 'Topics'
            }
        };

        var chart = new google.visualization.BarChart(document.getElementById('chart_div'));

        chart.draw(data, options);
    }
    $('.modal').modal('show');

    drawPref("", pref);




}
function loadMoreStories (callback){
    var data = {
        likes: Object.keys(likes),
        dislikes: Object.keys(dislikes),
        count: 50,
        twitter: url('?twitter'),
        "dickens": url('?dickens'),
        ignores: Object.keys(shown),
        group: url('?group') ? url('?group').split(","): null

    };
    loading = true;
    api("meetup", data, function(data){
        callback(data);
        pref = data.pref;
        origPref = data["orig-pref"];
        titles = data["topic-titles"];
        loading = false;
    });

}
/*** Init ***/
// issue request to rec. sys.
loadMoreStories(function(data){
    banner.transition({animation:'fade',
                       duration  : 1000});
    footer.show();
    loader.hide();
    cardContainer.empty();
    appendStories(data.meetups);
    loadMoreDiv.show();
    settingButton.click(showPreferences);
    //toastr.info("Personalization finished. The access to your personal data has been revoked");
    $(window).scroll(function() {
        if(!loading && $(window).scrollTop()+301 >= $(document).height() - $(window).height()) {
            loadMoreStories(function(data){
                appendStories(data.meetups);
                $(window).scrollTop($(window).scrollTop()-1);

            });

        }
    });
});

