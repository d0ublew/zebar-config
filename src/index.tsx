/* @refresh reload */
import { createSignal } from "solid-js";
import "./index.css";
import * as glazewm from "glazewm";
// import "./audio.module.css";
import { createStore } from "solid-js/store";
import { For, render } from "solid-js/web";
import * as zebar from "zebar";

const providers = zebar.createProviderGroup({
  glazewm: { type: "glazewm" },
  network: { type: "network" },
  date: { type: "date", formatting: "EEE d MMM T" },
  cpu: { type: "cpu" },
  battery: { type: "battery", refreshInterval: 5000 },
  memory: { type: "memory" },
  weather: { type: "weather" },
  audio: { type: "audio" },
  media: { type: "media" },
  // systray: { type: 'systray' },
});

render(() => <App />, document.getElementById("root"));

function App() {
  const [output, setOutput] = createStore(providers.outputMap);

  providers.onOutput((outputMap) => setOutput(outputMap));

  return (
    <div class="app">
      <div class="left">
        <div class="wm-container">
          {
            //@ts-ignore
            output.glazewm?.isPaused && (
              <div class="chip" style="background-color: #f7768e">
                <button
                  type="button"
                  onClick={() => output.glazewm.runCommand("wm-toggle-pause")}
                >
                  <i class="nf nf-fa-lock" />
                </button>
              </div>
            )
          }

          <For each={output.glazewm?.bindingModes}>
            {(bindingMode) => (
              <div class="chip" style="background-color: #e0af68">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    output.glazewm.runCommand(
                      `wm-disable-binding-mode --name ${bindingMode.name}`,
                    );
                  }}
                >
                  {(bindingMode.name === "resize" && (
                    <i class="nf nf-fa-edit" />
                  )) ||
                    bindingMode.name}
                  {/*bindingMode.displayName ?? bindingMode.name*/}
                </button>
              </div>
            )}
          </For>

          <div class="chip workspaces">
            <For each={output.glazewm?.currentWorkspaces}>
              {(workspace) => (
                <button
                  type="button"
                  class={`workspace ${workspace.hasFocus && "focused"} ${workspace.isDisplayed && "displayed"}`}
                  onClick={(e) => {
                    e.preventDefault();
                    output.glazewm.runCommand(
                      `focus --workspace ${workspace.name}`,
                    );
                  }}
                >
                  {workspace.displayName ?? workspace.name}
                </button>
              )}
            </For>
          </div>
        </div>

        <div class="workspace-title">
          {marquee(
            output.glazewm?.focusedContainer.type ===
              glazewm.ContainerType.WINDOW
              ? output.glazewm.focusedContainer.title
              : "",
            84,
          )}
        </div>
      </div>

      <div class="center">
        <div
          class="chip"
          style="background-color: #e0af68; color: #292e42; font-weight: bold;"
        >
          {"\u2002"}
          {output.date?.formatted}
          {"\u2002"}
        </div>
      </div>

      <div class="right">
        {output.glazewm && (
          <div class="chip">
            <button
              type="button"
              onClick={() =>
                output.glazewm.runCommand("toggle-tiling-direction")
              }
            >
              <span class="chip-text">
                <i
                  class={`nf ${output.glazewm.tilingDirection === "horizontal" ? "nf-md-swap_horizontal" : "nf-md-swap_vertical"}`}
                />
                {/*output.glazewm.tilingDirection === "horizontal" ? "H" : "V"*/}
              </span>
            </button>
          </div>
        )}

        <div class="media-container">
          <div class="chip media-pill-container">
            <span class="chip-text">
              <i class="nf nf-fa-music" />
              {"\u2002"}
              {marquee(output.media?.currentSession?.title ?? "offline", 12)}
            </span>
            {getMediaControl(output.media)}
          </div>
          {getMediaPopup(output.media)}
        </div>

        {output.audio?.defaultPlaybackDevice && (
          <div class="chip audio-container">
            <span class="chip-text">
              <i class="nf nf-fa-volume_high" />
              {output.audio.defaultPlaybackDevice.volume
                .toString()
                .padStart(3, "\u2002")}
              %
            </span>
            <div class="audio-slider-container">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const val = output.audio.defaultPlaybackDevice.volume;
                  if (val > 0) {
                    output.audio.setVolume(val - 1);
                  }
                }}
              >
                <i class="nf nf-fa-minus" />
              </button>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                class="audio-slider"
                value={output.audio.defaultPlaybackDevice.volume}
                onChange={(e) => output.audio.setVolume(e.target.valueAsNumber)}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const val = output.audio.defaultPlaybackDevice.volume;
                  if (val > 0) {
                    output.audio.setVolume(val + 1);
                  }
                }}
              >
                <i class="nf nf-fa-plus" />
              </button>
            </div>
          </div>
        )}

        <div class="chip">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              output.glazewm?.runCommand("shell-exec ms-settings:network-wifi");
            }}
          >
            <span class="chip-text">
              {getNetworkIcon(output.network)}
              {"\u2002"}
              {marquee(getNetworkText(output.network), 24)}
            </span>
          </button>
        </div>

        {output.memory && (
          <div class="chip">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                output.glazewm?.runCommand("shell-exec taskmgr");
              }}
            >
              <span class="chip-text">
                <i class="nf nf-fa-memory" />
                {Math.round(output.memory.usage)
                  .toString()
                  .padStart(3, "\u2002")}
                %
              </span>
            </button>
          </div>
        )}

        {output.cpu && (
          <div class="chip">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                output.glazewm.runCommand("shell-exec taskmgr");
              }}
            >
              <span class="chip-text">
                <i class="nf nf-oct-cpu" />
                {Math.round(output.cpu.usage).toString().padStart(3, "\u2002")}%
              </span>
            </button>
          </div>
        )}

        {output.battery && (
          <div
            class="chip"
            style={`background-color: ${getBatteryColor(output.battery)}; color: #292e42; font-weight: bold;`}
          >
            <span class="chip-text">
              {getBatteryIcon(output.battery)}
              {Math.round(output.battery.chargePercent)
                .toString()
                .padStart(3, "\u2002")}
              %
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function getAppTitle(gwo: zebar.GlazeWmOutput): string {
  if (
    !gwo.focusedContainer ||
    gwo.focusedContainer.type !== glazewm.ContainerType.WINDOW
  ) {
    return "";
  }
  const window = gwo.focusedContainer;
  const max_len = 96;
  let title = window.title;
  if (title.length > max_len) {
    title = `${title.substring(0, max_len - 1)}…`;
  }
  return title;
}

function marquee(s: string, max_len: number) {
  // const spacer = "\u2002\u2002\u2002\u2002";
  if (!s) {
    return <div />;
  }
  if (s.length >= max_len) {
    return (
      <div class="marquee">
        <div class="marquee__inner">
          <span>{s}</span>
          <span>{s}</span>
          <span>{s}</span>
          <span>{s}</span>
        </div>
      </div>
    );
  }
  return <span>{s}</span>;
}

function truncate(s: string, max_len: number) {
  if (!s) {
    return undefined;
  }
  let s_trunc = s;
  if (s_trunc.length > max_len) {
    s_trunc = `${s_trunc.substring(0, max_len - 1)}…`;
  }
  return s_trunc;
}

function secondsToTime(seconds: number) {
  const minutes = Math.floor(seconds / 60); // Get the minutes
  const remainingSeconds = seconds % 60; // Get the remaining seconds
  // Pad with leading zeros if necessary
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = remainingSeconds.toString().padStart(2, "0");
  return `${formattedMinutes}:${formattedSeconds}`;
}

function getBatteryIcon(battery: zebar.BatteryOutput) {
  if (battery.isCharging) return <i class="nf nf-md-battery_charging" />;
  if (battery.chargePercent > 90) return <i class="nf nf-md-battery" />;
  if (battery.chargePercent > 70) return <i class="nf nf-md-battery_70" />;
  if (battery.chargePercent > 40) return <i class="nf nf-md-battery_50" />;
  if (battery.chargePercent > 20) return <i class="nf nf-md-battery_30" />;
  return <i class="nf nf-md-battery_10" />;
}

function getBatteryColor(battery: zebar.BatteryOutput) {
  if (battery.isCharging) return "#9ece6a";
  if (battery.chargePercent > 90) return "#7aa2f7";
  if (battery.chargePercent > 70) return "#bb9af7";
  if (battery.chargePercent > 40) return "#e0af68";
  if (battery.chargePercent > 20) return "#f7768e";
  return "#f7768e";
}

function getNetworkIcon(network: zebar.NetworkOutput) {
  switch (network?.defaultInterface?.type) {
    case "ethernet":
      return <i class="nf nf-md-ethernet_cable" />;
    case "wifi":
      if (network?.defaultGateway?.signalStrength >= 80) {
        return <i class="nf nf-md-wifi_strength_4" />;
      }
      if (network?.defaultGateway?.signalStrength >= 65) {
        return <i class="nf nf-md-wifi_strength_3" />;
      }
      if (network?.defaultGateway?.signalStrength >= 40) {
        return <i class="nf nf-md-wifi_strength_2" />;
      }
      if (network?.defaultGateway?.signalStrength >= 25) {
        return <i class="nf nf-md-wifi_strength_1" />;
      }
      return <i class="nf nf-md-wifi_strength_outline" />;
    default:
      return <i class="nf nf-md-wifi_strength_off_outline" />;
  }
}

function getNetworkText(network: zebar.NetworkOutput) {
  if (network?.defaultInterface) {
    if (network?.defaultGateway) {
      // return `${network?.defaultInterface?.ipv4Addresses} (${truncate(network?.defaultGateway?.ssid, 24)})`;
      return network?.defaultGateway?.ssid;
    }
    // return `${network?.defaultInterface?.ipv4Addresses} (${truncate(network?.defaultInterface?.friendlyName, 24)})`;
    return network?.defaultInterface?.friendlyName;
  }
  return "disconnected";
}

function getMediaControl(media: zebar.MediaOutput) {
  if (!media?.currentSession) {
    return <div />;
  }
  return (
    <div class="media-control">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          media?.previous();
        }}
      >
        <i class="nf nf-md-skip_previous" />
      </button>
      <button type="button" onClick={() => media?.togglePlayPause()}>
        <i
          class={`nf ${media?.currentSession?.isPlaying ? "nf-fa-pause" : "nf-fa-play"}`}
        />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          media?.next();
        }}
      >
        <i class="nf nf-md-skip_next" />
      </button>
    </div>
  );
}

function getMediaPopup(media: zebar.MediaOutput) {
  if (!media?.currentSession) {
    return <div />;
  }
  return (
    <div class="media-popup-container">
      <div class="media-popup">
        <div class="media-title">{media?.currentSession?.title}</div>
        <div class="media-artist">{media?.currentSession?.artist}</div>
        <div class="media-album-title">{media?.currentSession?.albumTitle}</div>
        <div class="media-album-artist">
          {media?.currentSession?.albumArtist}
        </div>
        <div class="media-progress">
          {secondsToTime(media?.currentSession?.position)}
          <input
            type="range"
            min={media?.currentSession?.startTime}
            max={media?.currentSession?.endTime}
            step="1"
            style="pointer-events: none; margin-right: 8px; margin-left: 8px;"
            value={media?.currentSession?.position}
          />
          {secondsToTime(media?.currentSession?.endTime)}
        </div>
        {getMediaControl(media)}
      </div>
    </div>
  );
}

// function App() {
//   const [output, setOutput] = createStore(providers.outputMap);
//
//   providers.onOutput(outputMap => setOutput(outputMap));
//
//   return (
//     <div class="app">
//       {output.audio?.defaultPlaybackDevice && (
//         <div class="chip">
//           {output.audio.defaultPlaybackDevice.name}-
//           {output.audio.defaultPlaybackDevice.volume}
//           <input
//             type="range"
//             min="0"
//             max="100"
//             step="2"
//             value={output.audio.defaultPlaybackDevice.volume}
//             onChange={e => output.audio.setVolume(e.target.valueAsNumber)}
//           />
//         </div>
//       )}
//       {output.media?.currentSession && (
//         <div class="chip">
//           Media: {output.media.currentSession.title}-
//           {output.media.currentSession.artist}
//           <button onClick={() => output.media?.togglePlayPause()}>
//             ⏯
//           </button>
//         </div>
//       )}
//       {output.cpu && <div class="chip">CPU usage: {output.cpu.usage}</div>}
//       {output.battery && (
//         <div class="chip">
//           Battery charge: {output.battery.chargePercent}
//         </div>
//       )}
//       {output.memory && (
//         <div class="chip">Memory usage: {output.memory.usage}</div>
//       )}
//       {output.weather && (
//         <div class="chip">Weather temp: {output.weather.celsiusTemp}</div>
//       )}
//       {output.systray && (
//         <div class="chip">
//           <For each={output.systray.icons}>
//             {icon => (
//               <img
//                 class="systray-icon"
//                 src={icon.iconUrl}
//                 title={icon.tooltip}
//                 onClick={e => {
//                   e.preventDefault();
//                   output.systray.onLeftClick(icon.id);
//                 }}
//                 onContextMenu={e => {
//                   e.preventDefault();
//                   output.systray.onRightClick(icon.id);
//                 }}
//               />
//             )}
//           </For>
//         </div>
//       )}
//     </div>
//   );
// }
