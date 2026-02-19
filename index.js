const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

console.log(
    '\n' +
    '┌────────────────────────────────────────────┐\n' +
    '│               ThailandCodes                │\n' +
    '│                    HOOK                    │\n' +
    '└────────────────────────────────────────────┘\n'
);

let config, athkar;

try {
    config = require('./config.json');
    athkar = require('./athkar.json');
    console.log('تم تحميل التكوين والأذكار بنجاح');
} catch (error) {
    console.error('خطأ في تحميل الملفات:', error.message);
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

 
let thikirInterval;
const startThikirInterval = () => {
    if (thikirInterval) clearInterval(thikirInterval);
    
    thikirInterval = setInterval(() => {
        if (athkar.length === 0) {
            console.log('لا توجد أذكار في القائمة');
            return;
        }
        
        const randomThikr = athkar[Math.floor(Math.random() * athkar.length)];
        console.log(`إرسال ذكر: ${randomThikr}`);
        
        config.channels.forEach(channelId => {
            const channel = client.channels.cache.get(channelId);
            if (channel) {
                channel.send(`**اذكر الله:**\n${randomThikr}`)
                    .catch(err => console.error(`لا يمكن إرسال الرسالة إلى القناة ${channelId}:`, err.message));
            }
        });
    }, config.interval * 60 * 1000);
};

client.once('ready', () => {
    console.log(`تم تشغيل البوت ${client.user.tag}!`);
    
    client.user.setPresence({
        status: 'online',
        activities: []
    });
    console.log('تم ضبط حالة البوت: online');
    startThikirInterval();
});

 
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!reload-athkar' && message.member.permissions.has('Administrator')) {
        try {
            
            delete require.cache[require.resolve('./athkar.json')];
            const newAthkar = require('./athkar.json');
            athkar.length = 0;
            Array.prototype.push.apply(athkar, newAthkar);
            
            message.reply('✅ تم تحديث قائمة الأذكار بنجاح!');
            console.log('تم تحديث قائمة الأذكار');
        } catch (error) {
            message.reply('❌ حدث خطأ أثناء تحديث الأذكار: ' + error.message);
            console.error('خطأ في تحديث الأذكار:', error);
        }
    }

    if (message.content.startsWith('!set-interval') && message.member.permissions.has('Administrator')) {
        const args = message.content.split(' ');
        if (args.length === 2 && !isNaN(args[1])) {
            config.interval = parseInt(args[1]);
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
            startThikirInterval();
            message.reply(`✅ تم ضبط الفترة على ${config.interval} دقائق`);
        } else {
            message.reply('❌ استخدم: !set-interval <عدد الدقائق>');
        }
    }

    if (message.content === '!add-thikr' && message.member.permissions.has('Administrator')) {
        message.reply('❌ هذه الميزة قيد التطوير. الرجاء إضافة الأذكار يدوياً إلى ملف athkar.json');
    }
});

client.login(process.env.TOKEN).catch(error => {
    console.error('خطأ في تسجيل الدخول:', error.message);
    console.log('تأكد من صحة التوكن في ملف config.json');
});
