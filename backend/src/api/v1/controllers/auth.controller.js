import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import config from '#src/config/config.js'
import { generateToken } from '#api/utils/jwt.util.js'
import User from '#api/models/user.model.js'

const Login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      return res.sendStatus(401)
    }
    const passwordMatch = bcrypt.compareSync(password, user.password)
    if (passwordMatch) {
      const accessToken = await generateToken({ _id: user._id }, config.accessTokenSecret, '1d')
      const refreshToken = await generateToken({ _id: user._id }, config.refreshTokenSecret, '30d')
      await updateRefreshToken(user._id, refreshToken)
      return res.status(200).json({ access_token: accessToken, refresh_token: refreshToken })
    }
    return res.status(401).json('Password incorrect')
  } catch (error) {
    console.log(error)
    return res.status(500).json(error)
  }
}

const Signup = async (req, res) => {
  const salt = 10
  try {
    const { name, email, password } = req.body
    // // validate input
    // const errors = validationResult(req)
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ errors: errors.array() })
    // }
    const validInput = email && password && name
    if (!validInput) {
      res.status(400).send('All input is required')
    }
    const oldUser = await User.findOne({ email })
    if (oldUser) {
      return res.status(409).json({ error: 'User Already Exist. Please Login' })
    }

    const hashedPassword = await bcrypt.hash(password, salt)
    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
    })
    await newUser.save()
    return res.status(200).json({ message: 'Account created successfully' })
  } catch (error) {
    console.log(error)
    return res.status(500).json(error)
  }
}

const RefreshToken = async (req, res) => {
  const refreshTokenFromClient = req.headers['x-refresh-token'] || req.body.refreshToken
  if (!refreshTokenFromClient) {
    return res.status(403).json({ message: 'No token provided' })
  }
  const user = await User.findOne({ refresh_token: refreshTokenFromClient })
  if (!user) {
    return res.status(403).json({ message: 'Invalid refresh token' })
  }
  try {
    jwt.verify(refreshTokenFromClient, config.refreshTokenSecret)
    const accessToken = await generateToken({ _id: user._id }, config.accessTokenSecret, '1h')
    return res.status(200).json({ access_token: accessToken })
  } catch (error) {
    console.error(error)
    return res.status(403).json({ message: 'Invalid refresh token' })
  }
}

const updateRefreshToken = async (id, refreshToken) => {
  try {
    await User.findByIdAndUpdate(id, { refresh_token: refreshToken }, { new: true })
  } catch (err) {
    console.log(err)
  }
}

const AuthController = {
  Login,
  Signup,
  RefreshToken,
}

export default AuthController
