const Koa = require('koa')

const app = new Koa()

app.listen(3001,()=>{
    console.log(`端口3001，启动！`)
})