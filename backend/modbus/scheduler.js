// import cli

export class PollingScheduler {
  constructor(client, ip) {
    this.client = client;
    this.ip = ip;
    this.tags = [];
    this.timer = null;
  }



  addTag(tag) {
    this.tags.push({
      ...tag,
      lastRun: 0
    });
  }

  removeTag(id) {
    this.tags = this.tags.filter(t => t.id !== id);
  }

  start(interval = 500) {
    console.log('[SCHEDULER] START', this.ip);
    if (this.timer) return;

    this.timer = setInterval(() => this.tick(), interval);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  async tick() {
    const now = Date.now();

    for (const tag of this.tags) {
      if (!tag.enabled) continue;
      if (now - tag.lastRun < tag.interval) continue;

      tag.lastRun = now;

      try {

        const data = await this.client.readDelta(
          this.ip,
          tag.unitId,
          tag.fc,
          tag.start,
          tag.length,
          tag.chunkSize
        );

        tag.onRead?.({
          data,
          ts: now
        });
      } catch (err) {
        tag.onError?.(err);
      }
    }
  }

}


// export class PollingScheduler {
//   constructor(client, ip) {
//     this.client = client;
//     this.ip = ip;
//     this.tags = [];
//     this.timer = null;
//     this.running = false;
//   }

//   start(interval = 500) {
//     console.log('[SCHEDULER] START', this.ip);
//     if (this.running) return;

//     this.running = true;

//     this.timer = setInterval(() => this.tick(), interval);
//   }

//   stop() {
//     console.log('[SCHEDULER] STOP', this.ip);

//     this.running = false;

//     if (this.timer) {
//       clearInterval(this.timer);
//       this.timer = null;
//     }
//   }

//   async tick() {
//     if (!this.running) return;

//     const now = Date.now();

//     for (const tag of this.tags) {

//       if (!this.running) return;

//       if (!tag.enabled) continue;
//       if (now - tag.lastRun < tag.interval) continue;

//       tag.lastRun = now;

//       try {
//         const data = await this.client.readDelta(
//           this.ip,
//           tag.unitId,
//           tag.fc,
//           tag.start,
//           tag.length,
//           tag.chunkSize
//         );

//         if (!this.running) return;

//         tag.onRead?.({
//           data,
//           ts: now
//         });

//       } catch (err) {
//         tag.onError?.(err);
//       }
//     }
//   }
// }