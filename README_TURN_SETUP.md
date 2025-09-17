# TURN 配置说明（开发/内网联调）

## 后端开启内置 TURN

在 `server/.env` 中新增（或以系统环境变量设置）：

```
ENABLE_TURN=1
TURN_LISTEN_IP=0.0.0.0
TURN_LISTEN_PORT=3478
# 机器A的对外可达 IP（局域网 IP），例如 192.168.43.178
TURN_PUBLIC_IP=192.168.43.178
TURN_MIN_PORT=49160
TURN_MAX_PORT=49200
TURN_USER=sa
TURN_PASS=sa_turn_pwd
```

安装依赖并启动：

```
cd server
npm i node-turn --save
npm run dev
```

Windows 防火墙放行：

```
# 3478/UDP
New-NetFirewallRule -DisplayName "TURN-3478-UDP" -Direction Inbound -Protocol UDP -LocalPort 3478 -Action Allow
# 转发端口范围（根据上面最小/最大端口）
New-NetFirewallRule -DisplayName "TURN-Relay-UDP" -Direction Inbound -Protocol UDP -LocalPort 49160-49200 -Action Allow
```

## 前端三端 .env 示例（放到各自应用根目录 .env.development 本地使用）

```
VITE_TURN_URL=turn:192.168.43.178:3478
VITE_TURN_USER=sa
VITE_TURN_CRED=sa_turn_pwd
```

注意：若你已使用 Nginx 443 对外，依旧保持，TURN 仅负责媒体中继。

## 验证

1. 双端刷新后再拨打一次；
2. 控制台应出现 ICE 候选往返（`onicecandidate`/`addIceCandidate <-`），若 NAT 受限也能转为 `relay` 类型；
3. `ontrack` 应出现 `kind=audio`，并听到声音；
4. 若无声，贴：
   - `connectionState=connected` 打印中的 senders/receivers；
   - `iceConnectionState` 变化；
   - `RTCIceCandidate` 的 `candidate` 字符串（注意打码 IP）。