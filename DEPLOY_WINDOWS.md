部署指引（Windows，HTTPS + Nginx 反代）

一、目标
- 机器A运行：后端(3001)与前端开发服务(5173/5174/5175)或打包静态资源
- Nginx 在机器A上做 TLS 终止与反向代理，对外仅开放 443
- 机器B/手机 通过 HTTPS 访问 A 的域名实现跨设备通话

二、准备域名与 hosts（内网用本地域名）
在 A、B 两台设备都添加 hosts（以 A 的 IPv4 替换 192.168.x.x）：

  192.168.x.x api.dev.local
  192.168.x.x family.dev.local
  192.168.x.x elderly.dev.local
  192.168.x.x nurse.dev.local

三、生成自签证书（PowerShell 管理员）
可使用 mkcert 或 openssl，以下示例用 openssl（已随 Git for Windows 附带）。

  mkdir -Force C:\nginx\certs
  cd C:\nginx\certs
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -keyout dev.local.key -out dev.local.crt \
    -subj "/C=CN/ST=Dev/L=LAN/O=SmartAging/OU=Dev/CN=dev.local"

注意：浏览器会提示不受信，可导入“受信任的根证书颁发机构”或使用 mkcert 生成受信证书。

四、安装并配置 Nginx（Windows 版）
1) 下载 nginx Windows 版本解压至 C:\nginx
2) 在 C:\nginx\conf 下新建 smart-aging.conf，内容见项目 scripts\nginx\smart-aging.conf
3) 在 C:\nginx\conf\nginx.conf 的 http {...} 内 include 该文件：

  http {
    ...
    include       conf/smart-aging.conf;
  }

五、项目内 .env 示例
1) 前端（各 app 目录）：.env.development

  VITE_WS_URL=wss://api.dev.local/ws
  VITE_SOCKET_IO_URL=https://api.dev.local
  # 可选：如已部署 TURN/TURNS
  VITE_TURN_URL=turns:turn.dev.local:5349
  VITE_TURN_USER=sa
  VITE_TURN_CRED=yourStrongPwd

2) 后端 server/.env

  ALLOW_CORS_ALL=1

六、启动顺序
1) 机器A：启动后端
  npm run dev:server

2) 机器A：启动前端
  npm run dev:elderly
  npm run dev:family
  npm run dev:nurse

3) 机器A：启动 Nginx
  以管理员运行 PowerShell：
  C:\nginx\nginx.exe -s stop  # 若已在运行
  C:\nginx\nginx.exe

七、验证
- 机器B 打开：https://family.dev.local/ 与 https://elderly.dev.local/
- 登录后互发通话邀请，浏览器应正常拉起麦克风（安全上下文）
- 网络面板中：API 指向 https://api.dev.local/api/...，WebSocket 指向 wss://api.dev.local/ws

八、常见问题
- 证书不受信：将 dev.local.crt 导入受信任根；或改用 mkcert。
- 仍是 CORS：确认 server/.env 的 ALLOW_CORS_ALL=1 并重启后端；查看浏览器请求的实际 Origin 与 Nginx 访问日志。
- 仍是 getUserMedia 失败：确保访问是 HTTPS；iOS 需用户手势触发播放；内核太旧需升级浏览器。

