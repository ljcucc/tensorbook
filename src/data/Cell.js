class Cell{
  #code = "";
  #logs = [];

  getCode(){
    log("get code");
    return this.#code;
  }

  setCode(code){
    log("set code");
    this.#code = code;
    return this.#code;
  }

  getLogs(){
    log("getting logs");
    return this.#logs;
  }

  clearLogs(){
    log("clear logs");
    this.#logs = [];
  }

  pushLogs(string){
    log("push log");
    this.#logs.push(string);
  }
}