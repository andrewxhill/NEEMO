var   express     = require('express')
    //, RedisPool   = require("./redis_pool")
    , io          = require('socket.io')
    , pub         = '/home/andrew/workspace/neemo/NEEMO/app/lib/neemo/public'
    , _           = require('underscore')
    , Step        = require('step')
    , sys         = require('sys')
    , fs          = require("fs")
    , path        = require("path")
    , querystring = require('querystring')
    , crypto      = require('crypto')
    , CAS         = require('cas')
    , csa         = {login: 'https://login.zooniverse.org', logout: 'https://login.zooniverse.org/logout', service: 'http://68.175.5.167:4000'}
    , OAuth       = require('oauth').OAuth
    , cartodb     = require('./cartodb')
    , RedisStore  = require('connect-redis')(express);

module.exports = function(opts){
    var opts = opts || {},
        cas  = new CAS({base_url: csa.login, service: csa.service}),
        store  = new express.session.MemoryStore;
    /* forces CSA signin to do anything fun */
    var cas_middleware = function(req, res, next){
        var ticket = req.param('ticket'),
            route  = req.url;
            
        if (route == '/index.html' || route == '/' || route == '/about.html' || route == '/favicon.ico') {
            //TODO get session.id into the client Cookie, need to include it with Socket requests
            //console.log(req.session.getSessionID());
            next();
        } else if (route == '/logout' ){
            res.cookie('socketAuth', null, { expires: new Date(Date.now() + 90000), httpOnly: false });
            req.session.loggedin = false;
            req.session.username = null;
            req.session.sid = null;
            res.redirect(csa.logout + '?service=' + csa.service);
        } else if (req.session && req.session.loggedin){
            res.cookie('socketAuth', req.session.sid, { expires: new Date(Date.now() + 90000), httpOnly: false });
            next();
        } else {
            if (ticket) {
                cas.validate(ticket, function(err, status, username) {
                  if (err) {
                    res.send({error: err});
                  } else {
                    if (status) {
                        req.session.loggedin = status;
                        req.session.username = username;
                        var data = req.socket.remoteAddress + '' + Math.round((new Date().valueOf() * Math.random())) + '';
                        data = crypto.createHash('md5').update(data).digest("hex");
                        req.session.sid = data;
                    }
                    res.redirect('/');
                  }
                });
            } else {
                res.redirect(csa.login + '?service=' + csa.service);
            }
        }
    };
    
    // initialize express server
    var app = express.createServer();
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ 
        secret: "string",  //TODO use a real secret
        store: store,
        cookie: { 
            maxAge: 60*60*24*30*1000
        }
    }));
    app.use('/js', express.static('./public/js'));
    app.use('/images', express.static('./public/images'));
    app.use('/css', express.static('./public/css'));
    app.use(cas_middleware);
    app.use('/regions', express.static('./public/regions'));
    app.use(express.static('./public'));
    app.use(express.logger({buffer:true, format:'[:remote-addr :date] \033[90m:method\033[0m \033[36m:url\033[0m \033[90m:status :response-time ms -> :res[Content-Type]\033[0m'}));

    cartodb.start(function(){
        require('./dirtsock').start(io.listen(app), this, store);
    });
    return app;
};

