$(window).resize(function(){
    if (window.innerWidth > 800) {
        $("#nav").removeClass('vertical');
    }
});

$("#menu").click(function(){
    $("#nav").toggleClass('vertical');
    return false;
});
