var LocalStrategy = require('passport-local').Strategy;

function initialize(passport, getUserByName, getUserById) {
    var authUser = (username, password, done) => {
        var username = getUserByName(username)
        if(username == null){
            return done(null, false, { message: 'User does not exist'})
        }

        try{
            if(password == username.password){
                return done(null, username)
            } else {
                return done(null, false, { message: 'Password incorrect'})
            }
        } catch (err){
            return done(err)

        }
    }

    passport.use(new LocalStrategy({ usernameField: 'username' },
    authUser))
    passport.serializeUser((username, done) => done(null, username.id))
    passport.deserializeUser((id, done) => {
        return done(null, getUserById(id))
    })

}

module.exports = initialize