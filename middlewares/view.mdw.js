const numeral = require('numeral');
const hbs_sections = require('express-handlebars-sections');
const exphbs  = require('express-handlebars');


module.exports = function(app){
    app.engine('hbs', exphbs({
        defaultLayout: 'main.hbs',
        layoutsDir: 'views/layouts',
        partialsDir: 'views/partials',
        extname: '.hbs',
        helpers: {
            section: hbs_sections(),
            format_number: function(value){
                return numeral(value).format('0,0') + ' đ';
            }
        },
    }));
    app.set('view engine', 'hbs');
}