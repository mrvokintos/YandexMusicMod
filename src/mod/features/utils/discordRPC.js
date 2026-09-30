const { BrowserWindow } = require("electron");
const { Client } = require("@xhayper/discord-rpc");

const CLIENT_ID = "1283109459463377011";
const ACTIVITY_COOLDOWN = 10 * 1000;

let lastActivityChanged = 0;
let client;

function initRpc() {
  client = new Client({ clientId: CLIENT_ID });

  client.login().catch((e) => {
    console.error("[DISCORD RPC]", e);
    setTimeout(initRpc, 3000);
  });

  client.on("ready", () => {
    console.log("[DISCORD RPC] Hooked!");
    console.log("client.user", client.user?.username);
  });

  client.on("disconnected", () => {
    console.log("[DISCORD RPC] Disconnected");
    setTimeout(initRpc, 3000);
  });

  client.on("error", () => {
    console.log("[DISCORD RPC] Error");
    setTimeout(initRpc, 3000);
  });
  client.on("close", () => {
    console.log("[DISCORD RPC] Closed");
    setTimeout(initRpc, 3000);
  });
}

async function updateActivity() {
  setTimeout(updateActivity, 1000);

  if (lastActivityChanged + ACTIVITY_COOLDOWN > Date.now()) return;

  if (!client?.user) return;
  lastActivityChanged = Date.now();

  try {
    const playerState = await GetAppPlayerState();
    if (!playerState) return;

    // Discord RPC не включен
    if (!playerState?.enabled) {
      client.user.clearActivity();
      return;
    }

    const playerStateData = playerState.data;

    if (!playerStateData?.trackMeta || !playerStateData?.playback || !playerStateData.isPlaying) {
      client.user.clearActivity();
      return;
    }

    const startTimestamp = Math.round(Date.now() - playerStateData.playback.position * 1000);
    const endTimestamp = Math.round(
      Date.now() + (playerStateData.playback.duration - playerStateData.playback.position) * 1000,
    );

    const coverUri = playerStateData.trackMeta.coverUri;
    const coverUrl = coverUri
      ? coverUri.startsWith("http://") || coverUri.startsWith("https://")
        ? coverUri.replaceAll("%%", "300x300")
        : `https://${coverUri.replaceAll("%%", "300x300")}`
      : undefined;
    const trackId = playerStateData.trackMeta.id;

    const rpcRequest = {
      type: 2,
      details: playerStateData.trackMeta.version
        ? `${playerStateData.trackMeta.title} ${playerStateData.trackMeta.version}`
        : playerStateData.trackMeta.title,
      largeImageKey: coverUrl,
      state: playerStateData.trackMeta.artists.map((a) => a.name).join(", "),
      startTimestamp: startTimestamp,
      endTimestamp: endTimestamp,
      buttons: trackId
        ? [
            {
              label: "🎵 Открыть",
              url: `https://music.yandex.ru/track/${trackId}`,
            },
          ]
        : [],
      instance: false,
    };

    if (playerState.showModButton) {
      rpcRequest.buttons.push({
        label: "💻 Yandex Music Mod",
        url: `https://github.com/HoleverGG/YandexMusicBetaMod`,
      });
    }

    client.user.setActivity(rpcRequest);

  } catch (ex) {
    console.log("[DISCORD RPC]", ex);
  }
}

initRpc();
updateActivity();

async function GetAppPlayerState() {
  const win = BrowserWindow.getAllWindows().find(
    (window) =>
      !window.isDestroyed() &&
      !window.webContents.isDestroyed() &&
      window.webContents.getURL().startsWith("music-application://desktop/"),
  );
  if (!win || win.webContents.isLoading()) return null;

  try {
    return await win.webContents.executeJavaScript(`
      (() => {
        if (typeof window.__getPlayerState !== "function") return null;
        try {
          return window.__getPlayerState();
        } catch (error) {
          console.error("[DISCORD RPC] Player state error:", error);
          return null;
        }
      })()
    `);
  } catch (error) {
    // Navigation can destroy the renderer while Electron executes the script.
    if (error?.message?.includes("Script failed to execute")) return null;
    throw error;
  }
}
