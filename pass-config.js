var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');

function initialize(passport, getUserByName, getUserById) {
    var authUser = async (username, password, done) => {
        var user = getUserByName(username)
        if(user == null || undefined){
            return done(null, false, { message: 'User does not exist'})
        }

        try{
            if(await bcrypt.compare(password == user.password)){
                return done(null, user)
            } else {
                return done(null, false, { message: 'Password incorrect'})
            }
        } catch (err){
            return done(err)

        }
    }

    passport.use(new LocalStrategy({ usernameField: 'username' },
    authUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
        return done(null, getUserById(id))
    })

}

module.exports = initialize