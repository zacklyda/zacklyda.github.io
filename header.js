$(window).resize(function()
{
    if (window.innerWidth <= "1000px")
    {
      document.getElementById("navbar").style.display = "none";
    }
    else
    {
      document.getElementById("navbar").style.display = "block";
    }
});
