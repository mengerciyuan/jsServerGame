// 引入Node.js原生net模块，用于创建TCP Socket服务器
const net = require('net');

// 游戏服务器配置
const SERVER_PORT = 3000;
const SERVER_HOST = '127.0.0.1';

// 存储所有已连接的玩家客户端（key: socket对象, value: 玩家昵称）
const connectedPlayers = new Map();

// 创建TCP Socket服务器
const gameServer = net.createServer((clientSocket) => {
    console.log('【新连接】有玩家尝试进入游戏...');

    // 1. 初始化新玩家（分配临时昵称，避免重复）
    const playerNickname = `玩家_${Date.now().toString().slice(-6)}`;
    connectedPlayers.set(clientSocket, playerNickname);

    // 向新玩家发送欢迎消息
    const welcomeMsg = `欢迎你，${playerNickname}！当前在线玩家：${Array.from(connectedPlayers.values()).join(', ')}\n`;
    clientSocket.write(welcomeMsg);

    // 2. 广播新玩家加入的消息给其他所有在线玩家
    broadcastMessage(`${playerNickname} 加入了游戏！`, clientSocket);

    // 3. 处理客户端发送过来的消息
    clientSocket.on('data', (data) => {
        // 解析客户端发送的消息（转换为字符串并去除首尾空白符）
        const playerMsg = data.toString().trim();
        if (!playerMsg) return;

        console.log(`【收到消息】${playerNickname}：${playerMsg}`);

        // 广播该玩家的消息给所有在线玩家
        broadcastMessage(`${playerNickname}：${playerMsg}`, clientSocket);
    });

    // 4. 处理玩家断开连接的事件
    clientSocket.on('close', () => {
        console.log(`【连接关闭】${playerNickname} 离开了游戏`);

        // 从在线玩家列表中移除该玩家
        connectedPlayers.delete(clientSocket);

        // 广播玩家离开的消息给其他在线玩家
        broadcastMessage(`${playerNickname} 离开了游戏！`, null);
    });

    // 5. 处理连接错误事件
    clientSocket.on('error', (err) => {
        console.error(`【连接错误】${playerNickname}：`, err.message);
        connectedPlayers.delete(clientSocket);
    });
});

/**
 * 广播消息给所有在线玩家（排除指定客户端，可选）
 * @param {string} message 要广播的消息
 * @param {net.Socket} excludeSocket 要排除的客户端（避免给自己发消息）
 */
function broadcastMessage(message, excludeSocket) {
    if (!message) return;

    // 遍历所有在线玩家，发送消息
    connectedPlayers.forEach((nickname, socket) => {
        // 排除指定客户端（如发送消息的玩家自己）
        if (socket === excludeSocket) return;

        // 确保socket处于可写状态，避免发送失败报错
        if (socket.writable) {
            socket.write(`${message}\n`);
        }
    });
}

// 启动游戏服务器，监听指定端口和主机
gameServer.listen(SERVER_PORT, SERVER_HOST, () => {
    console.log(`【服务器启动成功】游戏Socket服务器运行在：${SERVER_HOST}:${SERVER_PORT}`);
    console.log(`【等待连接】可通过TCP客户端连接（如telnet、nc或自定义客户端）`);
});

// 处理服务器启动错误
gameServer.on('error', (err) => {
    console.error('【服务器错误】', err.message);
});