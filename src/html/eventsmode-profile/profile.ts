import { dirname } from '@discordx/importer';
import { readFileSync } from 'node:fs';
import nodeHtmlToImage from 'node-html-to-image';

interface EventsmodeProfileProps {
  user: {
    avatar: string;
    nickname: string;
    staffRole: string;
  };
  stats: {
    totalTime: string;
    totalSalary: number;
    weeklyTime: string;
    weeklySalary: number;
    warns: number;
    date: string;

    favoriteEvent: string;
    longestEvent: string;

    hearts: number;
    top: number;

    percentage: number;
  };
}

export async function generateEventsmodeProfile(props: EventsmodeProfileProps) {
  const profileHtml = readFileSync(dirname(import.meta.url) + '/index.html', 'utf8');

  const image = readFileSync(dirname(import.meta.url) + '/background.png');
  const base64Image = image.toString('base64');
  const dataURI = 'data:image/jpeg;base64,' + base64Image;

  return (await nodeHtmlToImage({
    html: profileHtml,
    content: { ...props, backgroundURL: dataURI },
    transparent: true,

    puppeteerArgs: {
      headless: true,
      executablePath: process.env.CHROME_BIN || undefined,
      args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage'],
    },
  })) as Buffer;
}
