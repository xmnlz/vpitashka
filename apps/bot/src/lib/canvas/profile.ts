import { createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import sharp from "sharp";
import type { SelectEventmode } from "../../schemas/eventmode";

type Stats = Omit<
  SelectEventmode,
  "id" | "guildId" | "userId" | "permissionRole" | "isHired" | "reputationScore"
>;

interface EventsmodeProfileProps {
  user: {
    avatar: string;
    nickname: string;
    permissionRole: string;
  };
  stats: Stats & {
    top: number;
    longestEvent: string;
    percentage: number;
    totalWarns: number;
  };
}

export const generateCanvasProfile = async (props: EventsmodeProfileProps) => {
  const { user, stats } = props;

  const canvas = createCanvas(1420, 785);
  const content = canvas.getContext("2d");
  const fondFamily = "DejaVu Sans Mono";

  const profile = await loadImage(__dirname + "/profile.png");
  content.drawImage(profile, 0, 0, canvas.width, canvas.height);

  const roundedAvatar = await createRoundedImage(user.avatar, 190);

  content.drawImage(roundedAvatar, 153, 177);

  content.fillStyle = "#FFFFFF";
  content.font = `700 32px ${fondFamily}`;
  content.textAlign = "center";

  content.fillText(
    `${
      user.nickname.length > 15
        ? `${user.nickname.slice(0, 15)}...`
        : user.nickname
    }`,
    245,
    440,
  );

  content.fillStyle = "#B0BCFF";
  content.font = `600 16px ${fondFamily}`;
  content.textAlign = "center";

  // TODO: Transform to a proper permission map
  content.fillText(user.permissionRole, 245, 490);

  // Statistics
  content.font = `600 22px ${fondFamily}`;

  // The longest event
  content.fillText(stats.longestEvent, 1175, 325);

  // Favorite event
  content.fillText(stats.favoriteEvent, 1175, 460);

  content.textAlign = "right";

  // Total time
  content.fillText(stats.totalTime.toString(), 970, 262);

  // Weekly time
  content.fillText(stats.weeklyTime.toString(), 970, 312);

  // Total salary
  content.fillText(stats.totalSalary.toString(), 940, 362);

  // Weekly salary
  content.fillText(stats.weeklySalary.toString(), 940, 412);

  // Warns
  content.fillText(`${stats.totalWarns} / 3`, 970, 462);

  // Date
  content.fillText(stats.hiredAt.toDateString(), 970, 512);

  content.font = `600 20px ${fondFamily}`;

  // Candy
  content.fillText(stats.hearts.toString(), 215, 676);

  // Top
  content.fillText(stats.top.toString(), 390, 676);

  content.font = `600 22px ${fondFamily}`;
  content.textAlign = "left";

  // Progress
  content.fillText(`${stats.percentage}%`, 520, 680);
  drawRoundedProgressBar(content, 520, 612, 700, 25, stats.percentage, 30);

  const bufferCanvas = canvas.toBuffer("image/png");

  return await sharp(bufferCanvas).resize(1420, 785).toBuffer();
};

const drawRoundedProgressBar = (
  ctx: SKRSContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number, // progress from 0 to 100
  borderRadius: number,
) => {
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

  drawBar(x, x + width, "#262732");

  if (progress > 0) {
    drawBar(x, x + progressWidth, "#B3BFFF");
  }
};

const createRoundedImage = async (imageURL: string, size: number) => {
  const image = await loadImage(imageURL);
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(image, 0, 0, size, size);

  return canvas;
};
