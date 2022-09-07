import { LitElement, html, css, classMap } from '/lib/lit.min.js';

import "https://cdn.jsdelivr.net/gh/vanillawc/wc-codemirror@2/index.js";
import "https://cdn.jsdelivr.net/gh/vanillawc/wc-codemirror@2/mode/javascript/javascript.js";

import "/src/components/IconButton.js";

export class NotebookKernel{
  #runQueue = [];
  #nextCallback;
  #resultCallback;

  #logs = [];
  #logger;

  consolelogCallback;

  constructor(){
    this.consolelogCallback = ()=>{};
  }

  ConsoleLogCatcher(...values){
    if(this.consolelogCallback){
      this.consolelogCallback(...values);
      // this.#logs.push(...value);
      this.consolelogCallback("got value", values)
      if(this.#logger) this.#logger(values);
    }else{
      console.error(values, this.consolelogCallback);
    }
  }

  startCatchingLog(){
    this.consolelogCallback = console.log;
    console.log = this.ConsoleLogCatcher.bind(this);
    window.logCatcher = this.ConsoleLogCatcher.bind(this);
    window.log = this.consolelogCallback;
  }

  endCatchingLog(){
    console.log = this.consolelogCallback;
  }

  start(){
    console.log(this.consolelogCallback);

    this.#kernelLoop()
  }

  async #kernelLoop(){
    while(true){
      await this.#waitNext()
      // const console = {
      //   log: this.ConsoleLogCatcher
      // }
      // this.#logs = [];
      this.startCatchingLog();
      let _code = this.#runQueue.shift();
      let _result;
      try {
        _result = await window.eval(`
      (async ()=>{
      const console = {
        log: window.logCatcher
      }; 
      ${_code}
    })()

     `); // thanks to https://stackoverflow.com/questions/12167800/using-eval-to-set-global-variables
      } catch (e) {
        this.#logger([`Error: ${e}`]);
      }
      if(this.#resultCallback) this.#resultCallback(_result);

      this.endCatchingLog();
      console.log("a loop done!");
    }
  }

  #waitNext(){
    return new Promise(resolve=>{
      this.#nextCallback = resolve;
    });
  }

  run(code, logger){
    return new Promise(resolve => {
      this.#logger = logger;
      this.#resultCallback = resolve;
      this.#runQueue.push(code);
      if (!this.#nextCallback) return;
      this.#nextCallback();
    });
  }
}

class NotebookBlock{
  #logs = [];
  #code = "";
  #kernel;

  constructor(code, kernel){
    this.#code = code;
    this.#logs = [];
    this.#kernel = kernel;
  }

  async run(updateCallabck){
    await this.#kernel.run(this.#code, ((values)=>{
      this.pushLogs(...values);
      updateCallabck();
    }).bind(this));
  }

  setCode(code){
    this.#code = code;
  }

  getCode(){
    return this.#code;
  }

  getLogs(){
    return this.#logs || [];
  }

  pushLogs(...msg){
    this.#logs.push(...msg);
  }

  clearLogs(){
    this.#logs = [];
  }
}

class NotebookBlockWidget extends LitElement{
  static properties = {
    kernel: {type: NotebookKernel},
    _menuOpen: { type: Boolean },
    nb: { type: NotebookBlock },
  };

  static styles = css`
  .code-block{
    margin: 16px;
    padding: 16px;
    border: 1px solid rgba(0,0,0,0.35);
    border-radius: 10px;

  }

  .edit-block{
    display: flex;
    flex-direction: row;
  }

  #run{
    height: 50px;
    width: 50px;
    position: sticky;
    top:0px;
  }

  .logs{
    display: flex;
    flex-direction: column;
    padding: 16px;
    font-family: monospace;
    font-size: 16px;
  }
  `;

  constructor(){
    super();

    this._menuOpen = false;
    // this._nb = new NotebookBlock();
  }

  async _run(){
    let code = this.renderRoot.querySelector("wc-codemirror").value;
    this.nb.setCode(code);
    this.nb.clearLogs();
    await this.nb.run((()=>{
      this.requestUpdate();
    }).bind(this));
  }

  _openMenu(){
    const dropmenu = this.renderRoot.querySelector("drop-menu");
    dropmenu.openMenu();
  }

  _closeMenu(){
    const dropmenu = this.renderRoot.querySelector("drop-menu");
    dropmenu.openMenu();
  }

  _onMenuSelected(e){
    const { id } = e.detail;

    if(id == "clear_console"){
      this.nb.clearLogs();
      return;
    }

    switch(id){
      case "new_cell_bottom":
      case "new_cell_top":
      case "delete_cell":
        this.dispatchEvent(new Event(id));
        break;
      default:
        return;
    }
  }

  render(){
    const logs = this.nb.getLogs().map(e=>html`<div>${e}</div>`);
    return html`
    <div class="code-block">
      <div class="edit-block">
        <!-- <button id="run" @click="${this._run}">run</button> -->
        <icon-button id="run" name="play_circle" @click="${this._run}"></icon-button>
        <wc-codemirror style="font-size: 16px;width: 100%;padding: 8px;max-width: calc(100% - 120px);" mode="javascript" .value=${this.nb.getCode()}></wc-codemirror>
        <icon-button name="more_horiz" @click="${this._openMenu}"></icon-button>
        <drop-menu>
          <dropmenu-array @select="${this._onMenuSelected}" .list=${[
          { title: "New cell at top", id: "new_cell_top" },
          { title: "New cell at bottom", id: "new_cell_bottom", type: "split" },
          { title: "Move cell up", id: "move_cell_up" },
          { title: "Move cell down", id: "move_cell_down"},
          { title: "Delete cell", id: "delete_cell", type: "split" },
          { title: "Clear logs", id: "clear_console" },
          { title: "Copy logs", id: "clear_console" },
        ]}></dropmenu-array>
        </drop-menu>
      </div>
      <div class="logs">
        ${logs}
      </div>
    </div>
    `;
  }
}

class AddBlockWidget extends LitElement{
  render(){
    return html`
      <div>
      </div>
    `;
  }
}

class NotebookWidget extends LitElement {
  static properties = {
    _kernel: { type: NotebookKernel },
    _blocks: { type: Array },
  };

  static styles = css`
  .block-list{
    max-height: calc(100vh - 60px);
    overflow-y: auto;
    box-sizing: border-box;
  }
  `;

  constructor() {
    super();

    this._kernel = new NotebookKernel();
    this._kernel.start();

    this._blocks = [
      new NotebookBlock("a=10", this._kernel),
      new NotebookBlock("console.log(a)", this._kernel),
      new NotebookBlock("console.log(a)", this._kernel),
      new NotebookBlock("console.log(a)", this._kernel),
      new NotebookBlock("console.log(a)", this._kernel),
      new NotebookBlock("console.log(a)", this._kernel),
    ];
  }
  
  _newCellBottom(i){
    return ()=>{
      console.log("new cell bottom", i);
      this._blocks.splice(i+1, 0, new NotebookBlock("// your code here", this._kernel));
      this.requestUpdate();
    };
  }

  _newCellTop(i){
    return ()=>{
      console.log("new cell top", i);
      this._blocks.splice(i, 0, new NotebookBlock("// your code here", this._kernel));
      this.requestUpdate();
    };
  }

  _deleteCell(i){
    return ()=>{
      console.log("delete cell", i);
      this._blocks.splice(i, 1);
      this.requestUpdate();
    };
  }

  render() {
    let blocksWidget = this._blocks.map((e, i) => {
      return html`
        <notebook-block-widget 
          .nb=${e}
          .kernel=${this._kernel}
          @new_cell_top="${this._newCellTop(i)}"
          @new_cell_bottom="${this._newCellBottom(i)}"
          @delete_cell="${this._deleteCell(i)}"
          ></notebook-block-widget>
      `
    });
    return html`
    <div class="block-list">
      ${blocksWidget}
    </div>
    `;
  }
}

customElements.define("notebook-widget", NotebookWidget);
customElements.define("notebook-block-widget", NotebookBlockWidget);
customElements.define("add-block", AddBlockWidget);