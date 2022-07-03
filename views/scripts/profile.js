function date_function(){
    var kcyear = document.getElementsByName("year")[0],
        kcmonth = document.getElementsByName("month")[0],
        kcday = document.getElementsByName("day")[0];

    var d = new Date();
    var n = d.getFullYear();
    for (var i = n; i >= 1950; i--) {
        var opt = new Option();         opt.value = opt.text = i;
        kcyear.add(opt);
    }
    kcyear.addEventListener("change", validate_date);
    kcmonth.addEventListener("change", validate_date);

    function validate_date() {
        var mlength = null;
        var y = +kcyear.value, m = kcmonth.value, d = kcday.value;
        if (m === "February")
            mlength = 28 + (!(y & 3) && ((y % 100) !== 0 || !(y & 15)));
        else if (m === 'January' || m === 'March' || m === 'May' || m === 'July' || m === 'August' || m === 'October' ||
        m === 'December')
            mlength = 31;
        else
            mlength = 30;
        kcday.length = 0;
        for (var i = 1; i <= mlength; i++) {
            var opt = new Option();
            opt.value = opt.text = i;
            if (i == d) opt.selected = true;
            kcday.add(opt);
        }
    }
    validate_date();
    console.log(d.getFullYear())
}
