import { verifyToken } from '#api/utils/jwt.util.js'

const isAuth = async (req, res, next) => {
  const { accessToken } = req.cookies
  if (accessToken) {
    try {
      if (accessToken === process.env.ACCESS_TOKEN_SECRET) {
        req.user = -1
        next()
      }
      else {
        const decoded = await verifyToken(accessToken, process.env.ACCESS_TOKEN_SECRET, {})
        req.user = decoded
        next()
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        if (error.message === 'jwt expired') {
          res.msg = error.message
          const decoded = await verifyToken(accessToken, process.env.ACCESS_TOKEN_SECRET, {
            ignoreExpiration: true,
          })
          req.user = decoded
          return next()
        }
      }

      return res.status(500).json({ error })
    }
  } else {
    return res.sendStatus(403)
  }
}

export default isAuth
