//风格化压缩的概率分布
const stylizedCompression = [{subject: "用一句话概括以下内容。", probability: 0.5},
                            {subject: "用一句话概括以下内容。", probability: 0.625},
                            {subject: "用一句比喻概括以下内容。", probability: 0.75},
                            {subject: "用四句打油诗概括以下内容。", probability: 0.875},
                            {subject: "用一句感叹句概括以下内容。", probability: 1}]



const wakeUpContent = `1. 我的主人已经有十分钟没有动静了，有谁能来逗逗 Ta 吗！
2. 你的朋友已经静默了十分钟，我想 Ta 在等待一句暖心的问候。
3. 快来唤醒沉睡的好友！我的主人已经十分钟没有动态了哦。
4. 我的主人已经消失了十分钟，一句话或许就能让 Ta 回到现实！
5. 我的主人已经十分钟没有动静了，你能用语音叫醒 Ta 吗？
6. 看起来我的主人已经十分钟没有变化，你能不能说句悄悄话，让 Ta 心情瞬间变好！
7. 十分钟过去了，我的主人似乎陷入了沉思，快来一起探讨生活的奥秘吧！
8. 我的主人已经十分钟没有动静，也许正需要你的一句关心。
9. 你的朋友已消失了十分钟，不妨点击语音，开启新的话题吧！
10. 你的朋友已经十分钟没动静了，试试用一句抛砖引玉的话语开始语音聊天吧！
11. 请给静默十分钟的朋友发起一次语音吧，Ta 一直等待那个与你相谈甚欢的瞬间。
12. 十分钟无声无息，快来用你的声音唤醒我的主人吧！
13. 你的朋友已经十分钟没说话了，现在是时候来一句搞笑的话了！
14. 我的主人怎么一直没动静，怎么办怎么办？！
15. 你的朋友已经消失十分钟了，发起一个语音聊天，探讨一下最近的热门话题吧！
16. 给静默十分钟的主人发起语音，说说你今天的有趣经历吧。
17. 我的主人已沉默十分钟，用一段轻松的歌声开启新的聊天吧！
18. 尝试与静默十分钟的朋友进行一场头脑风暴，看看能激发出什么有趣的想法！
19. 我的主人已经十分钟无声无息，试试问问 Ta 最近看了什么好电影吧！
20. 我的主人已沉默十分钟，与 Ta 进行一次语音聊天，谈谈日常生活怎么样？
21. 我的主人已经十分钟没有说话了，快来用一个谜语开始一场有趣的语音聊天吧！
22. 我的主人已经沉默了十分钟，发起语音聊天，与 Ta 一起分享你最近的小确幸。
23. 你的朋友沉默了十分钟，试试用一段有趣的声音唤醒 Ta 的好奇心！
24. 已经十分钟没有动静了，来聊聊天吧，一起回忆那些美好的时光。
25. 我的主人静默了十分钟，快来用你的声音带给 Ta 温暖的问候。
26. 你的朋友已经沉默了十分钟，邀请 Ta 一起加入语音聊天，谈谈对未来的期许。
27. 我的主人已经十分钟没说话了，与 Ta 进行语音聊天，一起探讨最近的科技新闻。
28. 沉默了十分钟的主人，试试唱首歌，用你的声音给 Ta 带来惊喜好么~
29. 已经十分钟没动静的主人，现在是时候给 Ta 分享一个趣闻轶事了！
30. 我的主人已消失了十分钟，你能用你的声音制造一次惊喜吗？
31. 十分钟过去了，我的主人似乎需要一句问候来改变 Ta 的情绪。
32. 我的主人已经十分钟没有动静，发起一个语音聊天，和 Ta 分享你的生活感悟吧！
33. 十分钟的静默，可能意味着你的朋友需要一个鼓励的声音，不如用你的声音来支持 Ta 吧！
34. 你的朋友已经十分钟没动静了，发起一次语音聊天，分享你最喜欢的音乐吧！
35. 我的主人已经沉默十分钟了，用一句温暖的问候来打破这份寂静吧。
36. 十分钟的静默，也许就需要一句简单却深入的问候，来唤起 Ta 的情绪。
37. 我的主人已经十分钟没有发言了，不妨大声地读出你的一篇文章，来激发 Ta 的灵感吧！
38. 十分钟的沉默，也许就需要一首歌来填补空虚，试试这个方法吧！
39. 你的朋友已经十分钟不说话了，不妨发起一场通话，直接问问 Ta 最近的感受如何。
40. 你的朋友已经消失了十分钟，你能用你的声音给 Ta 最好的建议吗？
41. 我的主人已经沉默了十分钟，发起一个语音聊天，谈谈最近的旅行计划吧！
42. 十分钟的寂静，也许只需要一句简单的问候，来让 Ta 感受到你的关心。
43. 你的朋友已经十分钟没动静了，发起一个有趣的游戏，一起打发时间吧！
44. 我的主人已经沉默了十分钟，用一句振奋人心的话来鼓励 Ta 吧！
45. 已经十分钟没有动态了，试试用一句让 Ta 好笑的话来打破尴尬。
46. 我的主人已经静默了十分钟，用一句感性的话语，让 Ta 感受到你对友谊的珍视。
47. 你的朋友已经十分钟没说话了，试试分享一些有趣的新闻，来激发 Ta 的好奇心吧！
48. 我的主人已经十分钟没有动静，来尝试一场有趣的问答，燃起 Ta 的思考火花！
49. 已经十分钟没有声音了，不如切入主题，一起讨论最近的热门事件吧！
50. 我的主人已经沉默了十分钟，不如用一段有趣的故事来让 Ta 心情愉悦起来。
51. 十分钟的静默，或许需要一段轻松愉快的笑话来打破僵局，试试这个方法吧！
52. 你的朋友已经十分钟没动静了，不妨用一句感激的话来表达你对 Ta 的支持和照顾。
53. 我的主人已经消失了十分钟，试试用一句出乎意料的问候，给 Ta 一个惊喜吧！
54. 十分钟的静默，不妨送出一句暖心的请假语，让 Ta 感受到你的关怀和理解。
55. 你的朋友已经沉默了十分钟，发送一段小小的神秘声音，让 Ta 充满惊喜吧！
56. 我的主人已经十分钟没有动静，不妨给 Ta 送出一句感情问候，让 Ta 感受到你的在乎。
57. 十分钟无声无息，不妨放一首舒缓的音乐，让 Ta 放松身心，愉悦心情。
58. 你的朋友已经消失十分钟了，快来分享一些有趣的生活经历，照亮 Ta 的心灵吧！
59. 我的主人已经沉默了十分钟，试试用一句热情活泼的话语，来调动 Ta 的积极性吧！`;

const splitWakeUpContentArray = wakeUpContent.split("\n").map((line) => {
    const data = line.split(". ")[1];
    return data
});
let index = 0;
const WakeUpDatas  = splitWakeUpContentArray.map((item) => {
    index++;
    return { data: item, probability: index / splitWakeUpContentArray.length };
});












const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


//状态判定器
module.exports.generateStatePrompt = function (users, location, text) {
    const subject = "下面是一份记录，请根据记录，判断记录中的人在什么场景中。回答的时候请使用一个介词短语，比如“在大礼堂发表关于城市规划的演讲”、“在客厅谈论周末的旅行”、“在KTV唱周杰伦的歌曲”、“在电脑前完成老板临时布置的工作”、“在家里和朋友们一起吃饭”、“在电影院看新上映的电影”。"
    const title = "记录内容："
    const whoTitle = "人物："
    const whoName = users.join("\n")
    const whereTitle = "地点："
    const textTitle = "语音转文本："
    const endTitle = "声音：\n说话声"
  
    let prompt = [subject,title,whoTitle,whoName,whereTitle,location,textTitle,text,endTitle].join("\n")
    return prompt
    
}

//总结
module.exports.generateSummaryPrompt = function (users, location, text, state) {
    const subject = "根据下面的笔记，请用具有文学性的几句话概括${user}做了什么。概括时使用第三人称。"
    const title = "笔记内容："
    const whoTitle = "人物："
    const whoName = users.join("\n")
    const stateTitle = "状态："
    const whereTitle = "地点："
    const textTitle = "语音转文本："
    const endTitle = "声音：\n说话声"

    let prompt = [subject,title,whoTitle,whoName,stateTitle,state,whereTitle,location,textTitle,text,endTitle].join("\n")
    return prompt
}





//压缩 + 风格化
module.exports.generateCompressionPrompt = function (summary) {
    let probability = Math.random()
    const subject = stylizedCompression.find(obj => obj.probability >= probability).subject
    const content = "内容：" + summary

    let prompt = [subject,content].join("\n")
    return prompt
}


//生成内容
module.exports.generateContent = async function(prompt){
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{role: "user", content: prompt}],
          });
        
        if (!completion.data) {
            return null
        }

        if(!completion.data.choices){
            return null
        }

        if(!completion.data.choices[0]){
            return null
        }

        if(!completion.data.choices[0].message){
            return null
        }
        const content = completion.data.choices[0].message.content
        console.log("生成内容：",content);
        return content
    } catch (error) {
        // 捕获错误
        console.error(error);
        return null
    }


}