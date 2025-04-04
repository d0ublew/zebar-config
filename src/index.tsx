/* @refresh reload */
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
  battery: { type: "battery" },
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
        {output.glazewm && (
          <div class="chip workspaces">
            {output.glazewm.currentWorkspaces.map((workspace) => (
              <button
                type="button"
                class={`workspace ${workspace.hasFocus && "focused"} ${workspace.isDisplayed && "displayed"}`}
                // @ts-ignore
                key={workspace.name}
                onClick={(e) => {
                  e.preventDefault();
                  output.glazewm.runCommand(
                    `focus --workspace ${workspace.name}`,
                  );
                }}
              >
                {workspace.displayName ?? workspace.name}
              </button>
            ))}
          </div>
        )}

        {output.glazewm && (
          <div class="workspace-title">{getAppTitle(output.glazewm)}</div>
        )}
      </div>

      <div class="center">{output.date?.formatted}</div>

      <div class="right">
        {
          //@ts-ignore
          output.glazewm?.isPaused && (
            <div class="chip">
              <button
                type="button"
                onClick={() => output.glazewm.runCommand("wm-toggle-pause")}
              >
                paused
              </button>
            </div>
          )
        }

        {output.glazewm?.bindingModes.map((bindingMode) => (
          //@ts-ignore
          <div class="chip" key={bindingMode.name}>
            <button
              type="button"
              // @ts-ignore
              onClick={(e) => {
                e.preventDefault();
                output.glazewm.runCommand(
                  `wm-disable-binding-mode --name ${bindingMode.name}`,
                );
              }}
            >
              {bindingMode.displayName ?? bindingMode.name}
            </button>
          </div>
        ))}

        {output.glazewm && (
          <div class="chip">
            <button
              type="button"
              onClick={() =>
                output.glazewm.runCommand("toggle-tiling-direction")
              }
            >
              <i
                class={`nf ${output.glazewm.tilingDirection === "horizontal" ? "nf-md-swap_horizontal" : "nf-md-swap_vertical"}`}
              />
            </button>
          </div>
        )}

        {output.media?.currentSession && (
          <div class="chip">
            <i class="nf nf-fa-music" />
            {truncate(output.media.currentSession.artist, 16)} -{" "}
            {truncate(output.media.currentSession.title, 32)}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                output.media?.previous();
              }}
            >
              <i class="nf nf-md-skip_previous" />
            </button>
            <button
              type="button"
              onClick={() => output.media?.togglePlayPause()}
            >
              <i
                class={`
                  nf
                  ${
                    output.media.currentSession.isPlaying
                      ? "nf-fa-pause"
                      : "nf-fa-play"
                  }`}
              />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                output.media?.next();
              }}
            >
              <i class="nf nf-md-skip_next" />
            </button>
          </div>
        )}

        {output.audio?.defaultPlaybackDevice && (
          <div class="chip audio-container">
            <i class="nf nf-fa-volume_high" />
            <span>
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

        {output.memory && (
          <div class="chip">
            <span class="chip-label">
              <i class="nf nf-fa-memory" />
            </span>
            {Math.round(output.memory.usage).toString().padStart(3, "\u2002")}%
          </div>
        )}

        {output.cpu && (
          <div class="chip">
            <span class="chip-label">
              <i class="nf nf-oct-cpu" />
            </span>
            {Math.round(output.cpu.usage).toString().padStart(3, "\u2002")}%
          </div>
        )}

        {output.battery && (
          <div class="chip">
            <span class="chip-label">
              <i class="nf nf-fa-battery_4" />
            </span>
            {Math.round(output.battery.chargePercent)
              .toString()
              .padStart(3, "\u2002")}
            %
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

function truncate(s: string, max_len: number): string {
  let s_trunc = s;
  if (s_trunc.length > max_len) {
    s_trunc = `${s_trunc.substring(0, max_len - 1)}…`;
  }
  return s_trunc;
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
