// const Koa = require('koa');
// const Router = require('koa-router');   
// const views = require('koa-views');
// const path = require('path')



// const bodyParser = require('koa-bodyparser');

// const app = new Koa();
// const router = new Router();



// app.use(views(path.join(__dirname, './views'), {
//     extension: 'ejs'
// }))

// // 定义数据源，这里是一个简单的假数据
// const data = [
//   { title: 'Data 1', description: 'This is data 1.' },
//   { title: 'Data 2', description: 'This is data 2.' },
//   { title: 'Data 3', description: 'This is data 3.' },
//   { title: 'Data 1', description: 'This is data 1.' },
//   { title: 'Data 2', description: 'This is data 2.' },
//   { title: 'Data 3', description: 'This is data 3.' },
//   { title: 'Data 1', description: 'This is data 1.' },
//   { title: 'Data 2', description: 'This is data 2.' },
//   { title: 'Data 3', description: 'This is data 3.' },
//   { title: 'Data 1', description: 'This is data 1.' },
//   { title: 'Data 2', description: 'This is data 2.' },
//   { title: 'Data 3', description: 'This is data 3.' },
//   { title: 'Data 1', description: 'This is data 1.' },
//   { title: 'Data 2', description: 'This is data 2.' },
//   { title: 'Data 3', description: 'This is data 3.' },
//   { title: 'Data 1', description: 'This is data 1.' },
//   { title: 'Data 2', description: 'This is data 2.' },
//   { title: 'Data 3', description: 'This is data 3.' },
//   { title: 'Data 1', description: 'This is data 1.' },
//   { title: 'Data 2', description: 'This is data 2.' },
//   { title: 'Data 3', description: 'This is data 3.' },
//   { title: 'Data 1', description: 'This is data 1.' },
//   { title: 'Data 2', description: 'This is data 2.' },
//   { title: 'Data 3', description: 'This is data 3.' },
//   { title: 'Data 1', description: 'This is data 1.' },
//   { title: 'Data 2', description: 'This is data 2.' },
//   { title: 'Data 3', description: 'This is data 3.' },
//   { title: 'Data 1', description: 'This is data 1.' },
//   { title: 'Data 2', description: 'This is data 2.' },
//   { title: 'Data 3', description: 'This is data 3.' },
//   { title: 'Data 1', description: 'This is data 1.' },
//   { title: 'Data 2', description: 'This is data 2.' },
//   { title: 'Data 3', description: 'This is data 3.' },
//   { title: 'Data 1', description: 'This is data 1.' },
//   { title: 'Data 2', description: 'This is data 2.' },
//   { title: 'Data 3', description: 'This is data 3.' },
//     { title: 'Data 1', description: 'This is data 1.' },
//   { title: 'Data 2', description: 'This is data 2.' },
//   { title: 'Data 3', description: 'This is data 3.' },
// ];

// console.log("__dirname:",__dirname)


// // 定义分页数量
// const perPage = 20;

// // 显示数据列表和分页
// router.get('/show', async (ctx) => {
//   //获取当前页数
//   const currentPage = ctx.query.page || 1;

//   // 计算总页数
//   const totalPages = Math.ceil(data.length / perPage);

//   // 获取当前页应该展示的数据
//   const startIndex = (currentPage - 1) * perPage;
//   const endIndex = startIndex + perPage;
//   const currentData = data.slice(startIndex, endIndex);

//   await ctx.render('index', {
//     data: currentData,
//     currentPage: parseInt(currentPage),
//     totalPages: totalPages,
//     totalPages,
//   });


// });

// app.use(bodyParser());
// app.use(router.routes());
// app.use(router.allowedMethods());

// const server = app.listen(3001, () => {
//   console.log('Server listening on port 3001');
// });


import { createClient } from 'redis';

const client = createClient();

client.on('error', err => console.log('Redis Client Error', err));
client.on('connect', err => console.log('Redis Client connect', err));
client.on('ready', err => console.log('Redis Client ready	', err));

await client.connect();

await client.set('key', 'value');
const value = await client.get('key');


// await client.set('names', 'value');

client.del('names')
const len = await client.lLen('lifeFlowQueue')
console.log(len)

for (let i = 0; i < 100; i++) {
    client.rPush('names', 'Flavio' + i)
}



const length = await client.lLen("names")
console.log(length)

const result = await client.lRange('names', 0, -1)
console.log(result)

const result3 = await client.lRange('names', 1, 2)
console.log(result3)

const result2 = await client.lRange('names', -1000, -200)
console.log(result2)

await client.disconnect();    



// console.log('connected');


// client.lPush('names', 'Flavio1')
// client.lPush('names', 'Flavio2')
// client.lPush('names', 'Flavio3')
// client.lPush('names', 'Flavio4')
// const result = await client.lRange('names', 0, -1)
// print(result)




// // 添加数据到列表中
// client.lpush('myList', 'item1', 'item2', 'item3', (error, length) => {
//   if (error) {
//     console.error(error);
//   } else {
//     console.log(`${length} items added to the list`);
//   }
// });

// // 获取列表长度
// client.llen('myList', (error, length) => {
//   if (error) {
//     console.error(error);
//   } else {
//     console.log(`List length is ${length}`);
//   }
// });

// // 获取指定范围内的列表元素
// client.lrange('myList', 0, -1, (error, items) => {
//   if (error) {
//     console.error(error);
//   } else {
//     console.log(`List items: ${items}`);
//   }
// });

// // 弹出列表中的元素
// client.lpop('myList', (error, item) => {
//   if (error) {
//     console.error(error);
//   } else {
//     console.log(`Popped item: ${item}`);
//   }
// });