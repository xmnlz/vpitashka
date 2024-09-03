// import { dirname } from '@discordx/importer';
// import { readFileSync } from 'node:fs';
// import puppeteer from 'puppeteer';
//
// interface EventsmodeProfileProps {
//   user: {
//     avatar: string;
//     nickname: string;
//     staffRole: string;
//   };
//   stats: {
//     totalTime: string;
//     totalSalary: number;
//     weeklyTime: string;
//     weeklySalary: number;
//     warns: number;
//     date: string;
//
//     favoriteEvent: string;
//     longestEvent: string;
//
//     hearts: number;
//     top: number;
//
//     percentage: number;
//   };
// }
//
// const profileHtml = readFileSync(dirname(import.meta.url) + '/index.html', 'utf8');
//
// const backgroundImage = readFileSync(dirname(import.meta.url) + '/background.png');
// const base64Image = Buffer.from(backgroundImage).toString('base64');
// const dataURI = 'data:image/jpeg;base64,' + base64Image;
//
// const browser = await puppeteer.launch({
//   headless: true,
//   executablePath: process.env['CHROME_BIN'] || undefined,
//   args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
// });
//
// export const generateEventsmodeProfile = async (props: EventsmodeProfileProps) => {
//   try {
//     const page = await browser.newPage();
//
//     await page.addStyleTag({
//       content: `@import url('https://fonts.googleapis.com/css2?family=Reddit+Mono&display=swap" rel="stylesheet')`,
//     });
//
//     await page.setContent(
//       profileHtml.replace(/{{([^}]+)}}/g, (_, key) =>
//         accessNestedObject({ ...props, backgroundURL: dataURI }, key),
//       ),
//     );
//
//     await page.waitForNetworkIdle({ concurrency: 10 });
//
//     const buffer = await page.screenshot({
//       type: 'png',
//       optimizeForSpeed: true,
//       omitBackground: true,
//       fullPage: true,
//     });
//
//     await page.close();
//
//     return Buffer.from(buffer);
//   } finally {
//     if (browser && !browser.connected) {
//       await browser.close();
//     }
//   }
// };
//
// const accessNestedObject = (obj: any, keyString: string): any => {
//   const keys: string[] = keyString.split('.');
//   let current: any = obj;
//   for (const key of keys) {
//     if (current[key] === undefined) {
//       return undefined;
//     }
//     current = current[key];
//   }
//   return current;
// };
