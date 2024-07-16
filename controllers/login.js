const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')

loginRouter.post('/', async (request, response) => {
  const { username, password } = request.body

//The code starts by searching for the user from the 
//database by the username attached to the request.
const user = await User.findOne({ username })

/*
  Next, it checks the password, also attached to the request.
  Because the passwords themselves are not saved to the database, 
  but hashes calculated from the passwords, the bcrypt.compare method 
  is used to check if the password is correct:
*/
const passwordCorrect = user === null
  ? false
  : await bcrypt.compare(password, user.passwordHash)

if (!(user && passwordCorrect)) {
  return response.status(401).json({
    error: 'invalid username or password'
  })
}
/* 
  If the password is correct, a token is created with the method jwt.sign. 
  The token contains the username and the user id in a digitally signed form.
*/
const userForToken = {
  username: user.username,
  id: user._id,
}

// token expires in 60*60 seconds, that is, in one hour
const token = jwt.sign(
    userForToken, 
    process.env.SECRET,
    { expiresIn: 60*60 }
)

/*
  The token has been digitally signed using a string from the environment 
  variable SECRET as the secret. The digital signature ensures that only
    parties who know the secret can generate a valid token. The value for 
    the environment variable must be set in the .env file.
  A successful request is responded to with the status code 200 OK. 
  The generated token and the username of the user are sent back in 
  the response body.
*/
response
  .status(200)
  .send({ token, username: user.username, name: user.name })
})

module.exports = loginRouter