import { createCanvas, loadImage, SKRSContext2D } from '@napi-rs/canvas';
import sharp from 'sharp';
import { dirname } from '@discordx/importer';

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

export async function generateCanvasProfile(props: EventsmodeProfileProps) {
  const canvas = createCanvas(1420, 785);
  const content = canvas.getContext('2d');

  const profile = await loadImage(dirname(import.meta.url) + '/profile.png');
  content.drawImage(profile, 0, 0, canvas.width, canvas.height);

  const roundedAvatar = await createRoundedImage(props.user.avatar, 190);

  content.drawImage(roundedAvatar, 153, 177);

  content.fillStyle = '#FFFFFF';
  content.font = '700 32 Montserrat';
  content.textAlign = 'center';

  content.fillText(
    `${
      props.user.nickname.length > 15
        ? `${props.user.nickname.slice(0, 15)}...`
        : props.user.nickname
    }`,
    245,
    440,
  );

  content.fillStyle = '#B0BCFF';
  content.font = '600 16 Montserrat';
  content.textAlign = 'center';

  content.fillText(props.user.staffRole, 245, 490);

  // Statistics
  content.font = '600 22 Montserrat';

  // The longest event
  content.fillText(props.stats.longestEvent, 1175, 325);

  // Favorite event
  content.fillText(props.stats.favoriteEvent, 1175, 460);

  content.textAlign = 'right';

  // Total time
  content.fillText(props.stats.totalTime, 970, 262);

  // Weekly time
  content.fillText(props.stats.weeklyTime, 970, 312);

  // Total salary
  content.fillText(props.stats.totalSalary.toString(), 940, 362);

  // Weekly salary
  content.fillText(props.stats.weeklySalary.toString(), 940, 412);

  // Warns
  content.fillText(`${props.stats.warns} / 5`, 970, 462);

  // Date
  content.fillText(props.stats.date, 970, 512);

  content.font = '600 20 Montserrat';

  // Candy
  content.fillText(props.stats.hearts.toString(), 215, 676);

  // Top
  content.fillText(props.stats.top.toString(), 390, 676);

  content.font = '600 22 Montserrat';
  content.textAlign = 'left';

  // Progress
  content.fillText(`${props.stats.percentage}%`, 520, 680);

  await drawRoundedProgressBar(content, 520, 612, 700, 25, props.stats.percentage, 30);

  const bufferCanvas = canvas.toBuffer('image/png');

  return await sharp(bufferCanvas).resize(1420, 785).toBuffer();
}

async function drawRoundedProgressBar(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number, // progress from 0 to 100
  borderRadius: number,
) {
  const normalizedProgress = Math.max(0, Math.min(progress, 100)) / 100;
  const progressWidth = width * normalizedProgress;
  const barRadius = Math.min(borderRadius, height / 2);

  function drawBar(startX: number, endX: number, fillColor: string) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(startX + barRadius, y);
    ctx.lineTo(endX - barRadius, y);
    ctx.arcTo(endX, y, endX, y + barRadius, barRadius);
    ctx.lineTo(endX, y + height - barRadius);
    ctx.arcTo(endX, y + height, endX - barRadius, y + height, barRadius);
    ctx.lineTo(startX + barRadius, y + height);
    ctx.arcTo(startX, y + height, startX, y + height - barRadius, barRadius);
    ctx.lineTo(startX, y + barRadius);
    ctx.arcTo(startX, y, startX + barRadius, y, barRadius);
    ctx.closePath();
    ctx.fill();
  }

  drawBar(x, x + width, '#262732');

  if (progress > 0) {
    drawBar(x, x + progressWidth, '#B3BFFF');
  }
}

async function createRoundedImage(imageURL: string, size: number) {
  const image = await loadImage(imageURL);
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(image, 0, 0, size, size);

  return canvas;
}
