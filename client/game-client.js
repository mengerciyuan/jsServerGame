// 引入Node.js原生net模块，用于创建TCP客户端
const net = require('net');
const readline = require('readline');

// 服务器配置（与服务器保持一致）
const SERVER_PORT = 3000;
const SERVER_HOST = '127.0.0.1';

// 创建TCP客户端，连接游戏服务器
const gameClient = net.createConnection({
    host: SERVER_HOST,
    port: SERVER_PORT
}, () => {
    console.log('【连接成功】已成功进入游戏服务器！');
});

// 创建命令行输入交互（方便玩家输入消息）
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '请输入消息> '
});

// 1. 处理从服务器接收的消息
gameClient.on('data', (data) => {
    // 清空当前输入行，显示服务器消息，再重新提示输入
    process.stdout.write('\x1B[2K\x1B[0G'); // 清除当前行并将光标移到行首
    console.log(`【服务器消息】${data.toString().trim()}`);
    rl.prompt();
});

/**
 * 主动断开连接的核心方法（优雅退出）
 */
function activeDisconnect() {
    console.log('【正在退出】正在优雅断开与游戏服务器的连接...');
    
    // 1. 优雅关闭TCP连接（优先使用 end()，确保数据发送完成）
    gameClient.end(); // 优雅断开：发送FIN包，等待服务器响应后关闭
    
    // 若需要强制断开（不推荐常规场景），可使用：
    // gameClient.destroy(); // 立即关闭，丢弃未发送数据
    
    // 2. 关闭命令行交互接口，清理资源
    rl.close();
}

// 2. 处理命令行输入（发送消息到服务器）
rl.on('line', (input) => {
     const msg = input.trim();
    
    // 匹配退出命令（新增「退出连接」中文指令，保留原有英文指令兼容）
    if (msg === '退出连接' || msg === 'exit' || msg === 'quit') {
        activeDisconnect();
        return;
    }
    
    // 非退出命令，发送消息到服务器
    if (msg) {
        gameClient.write(msg);
    }
    rl.prompt();
}).on('close', () => {
    console.log('【客户端退出】已离开游戏');
    gameClient.end();
    process.exit(0);
});

// 3. 处理客户端连接错误
gameClient.on('error', (err) => {
    console.error('【连接错误】无法连接到游戏服务器：', err.message);
    rl.close();
    process.exit(1);
});

// 4. 处理服务器断开连接
gameClient.on('close', () => {
    console.log('【连接断开】与游戏服务器的连接已断开');
    rl.close();
    process.exit(0);
});

// 启动命令行输入提示
rl.prompt();