const http = require('http')
const fs = require('fs')
const path = require('path')

const port = 5173

const server = http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url
  const filePath = path.join(__dirname, urlPath)

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404
      res.end('Not Found')
      return
    }
    const ext = path.extname(filePath).slice(1)
    const types = {
      html: 'text/html; charset=utf-8',
      js: 'text/javascript; charset=utf-8',
      css: 'text/css; charset=utf-8'
    }
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream')
    res.end(data)
  })
})

server.listen(port, () => {
  console.log(`http://localhost:${port}/`)
})
