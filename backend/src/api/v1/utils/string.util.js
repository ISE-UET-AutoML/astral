const randomString = (length) => {
  let result = ''
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

// E.g. images/cat/cat_01.jpg => label: cat, path: cat/cat_01.jpg
// TODO: Handle case len(pathArray) < 2
const getLabelAndFilePath = (path) => {
  const pathArray = path.split('/')
  const label = pathArray[1]
  const filePath = pathArray.slice(1).join('/')
  return { label, path: filePath }
}

const randomUID = () => {
  return randomString(8)
}

export { randomString, randomUID, getLabelAndFilePath }
