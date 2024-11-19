const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 8080
const client = require('./client')

const runServer = async () => {
   client
   const app = express()
   app.set('json spaces', 2)
      .use(express.json())
      .use(bodyParser.json({
         limit: '50mb'
      }))
      .use(bodyParser.urlencoded({
         limit: '50mb',
         extended: true,
         parameterLimit: 50000
      }))
      .use(express.static(path.join(__dirname, 'public')))
   app.use('/', (req, res) => {
    res.send("Hello World")
   })
   app.disable('x-powered-by')
   app.listen(PORT, () => {
      const CFonts = require('cfonts')
      CFonts.say('Nazuna AI', {
         font: 'tiny',
         align: 'center',
         colors: ['system']
      }), CFonts.say('Github : https://github.com/zeyndvp/nazunaai', {
         colors: ['system'],
         font: 'console',
         align: 'center'
      })
      console.log(`Server is running in port ${PORT}`)
   })
}

runServer().catch(() => runServer())