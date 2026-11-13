const svgImage = (width, height, shapes) => 'data:image/svg+xml;base64,' + Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes}</svg>`
).toString('base64');

module.exports = {
  uid: 10000001, name: '山野放映室', level: 6,
  sign: '带上相机去散步，记录山野和城市之间的微小日常。🎞️',
  follower: 128432, following: 356, like: 1428700,
  face: svgImage(100, 100, `<rect width="100" height="100" fill="#F4BC81"/><circle cx="70" cy="32" r="15" fill="#FFF1CC"/>
    <path d="M0 78L35 30L66 71L77 58L100 84V100H0Z" fill="#25455A"/>
    <path d="M0 91L31 62L53 87L76 69L100 83V100H0Z" fill="#48766E"/>
    <path d="M35 30L50 50L35 45L25 48Z" fill="#FFF1CC"/>`),
  video: {
    title: '去海边等一场日出 · 周末散步影像',
    play: 86341,
    cover: svgImage(640, 360, `<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#756690"/><stop offset="1" stop-color="#F9B587"/></linearGradient></defs>
      <rect width="640" height="360" fill="url(#sky)"/><circle cx="452" cy="141" r="43" fill="#FFE5B8"/>
      <path d="M0 174Q185 154 310 207T640 218V360H0Z" fill="#3D5873"/>
      <path d="M0 225Q168 197 333 249T640 233V360H0Z" fill="#243B55"/>
      <path d="M0 277Q193 232 350 294T640 275V360H0Z" fill="#182941"/>
      <path d="M372 208h113m-93 17h149m-129 19h93m-110 28h140m-97 18h82" stroke="#FFC394" stroke-opacity=".58" stroke-width="2"/>`)
  }
};
