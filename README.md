# vpitashka 

## 💡 About

- [Source Code](https://github.com/xmnlz/vpitashka)

An interactive bot designed for hosting events on the two largest and popular servers, [Meta](https://discord.gg/metaplay) and [Tenderly](https://discord.gg/tenderly) (~500.000 members), within the [CIS](https://en.wikipedia.org/wiki/Commonwealth_of_Independent_States) region.
This bot is tailored to facilitate seamless event management and engagement on these prominent discord servers.

## ✨ Features
- Event a.k.a Mini-games System
- Fully customizable configuration
- Event Moderation System
- Event Currency System

## 📦 Built With
- [discord.js](https://discord.js.org/)
- [discordx](https://discordx.js.org/)
- [typeorm](https://github.com/typeorm/typeorm)

## How to run?
- Configure `env.production` file with `.env.example` template 
```bash
docker compose --env-file .env.production up --build vpitashka -d
```
> [!CAUTION]
> To avoid confusion with our hosted version of vpitashka, you are not allowed to publicly host another instance of vpitashka under the same name and use the same avatar.
