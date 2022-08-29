import {LitElement, html, css, until} from '/lib/lit.min.js';

import "/src/AppBox.js";

class MainApp extends LitElement{
  static styles = css`
  .app{
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100dvh;
    overflow: hidden;
  }

  .layout{
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
  `;

  render(){
    return html`
    <div class="app">
      <div class="layout">
        <app-box>
          <!-- <slot></slot> -->
          <notebook-widget></notebook-widget>
        </app-box>
      </div>
    </div>
    `;
  }
}


customElements.define("main-app", MainApp);