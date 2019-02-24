const passport = require('passport');
const LocalStrategy = require('passport-local');
const { User } = require('./models');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  let err;
  const user = await User.getWithId(id);
  if (!user) {
    err = 'User not found';
  }
  done(err, user);
});

const localLogin = new LocalStrategy(async function(username, password, done) {
  const user = await User.getWithCredentials(username, password);

  // user not found
  if (!user) return done(null, false, { message: 'Username does not exist' });
  return done(null, user);
});

passport.use(localLogin);
